import * as React from "react"
import getLogger from "common/log/Logger"
import {
  child, CursorPointer,
  directChild,
  Ellipsis,
  Fill,
  FillHeight,
  FillWidth,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexRowCenter,
  FlexScale,
  IThemedProperties,
  makeDimensionConstraints,
  makeHeightConstraint,
  makeMarginRem,
  makePaddingRem,
  makeTransition,
  makeWidthConstraint, mergeClasses, mergeStyles,
  OverflowAuto,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative,
  rem, Transparent,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {IIssue} from "common/models/Issue"
import {Typography} from "@material-ui/core"
import Divider from "@material-ui/core/Divider"
import {FlexSpacer} from "renderer/components/elements/FlexSpacer"
import Labels from "renderer/components/elements/Labels"
import {ILabel} from "common/models/Label"
import {getValue} from "typeguard"
import Avatar from "renderer/components/elements/Avatar"
import Moment from "react-moment"
import {darken} from "@material-ui/core/styles/colorManipulator"
import Milestone from "./Milestone"
import {IMilestone} from "common/models/Milestone"
import {getIssue, patchIssue, patchIssueAssignees, patchIssueLabels, patchIssueMilestone} from "renderer/net/IssueAPI"
import {uiTask} from "renderer/util/UIHelper"
import * as _ from 'lodash'
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {Color} from "csstype"
import HorizontalScroll from "renderer/components/elements/HorizontalScroll"
import Collaborators from "renderer/components/elements/Collaborators"
import {ICollaborator} from "common/models/Repo"

const log = getLogger(__filename)

declare global {
  type IssueListItemColor = "bg" |
    "number" |
    "updatedAt" |
    "topBg" |
    "outline" |
    "boxShadow" |
    "dividerBoxShadow" |
    "text"
  type IssueListItemColors = { [key in IssueListItemColor]: Color }

  interface IIssueListItemStyles {
    colors: {
      normal: IssueListItemColors,
      selected: IssueListItemColors
    }
  }
}

function baseStyles(theme): any {
  const
    {palette, focus, components: {IssueListItem, Milestone}} = theme,
    {primary, secondary, action} = palette

  const
    colorGetter = (color: IssueListItemColor): ((props: P) => Color) => (props: P) => {
      const colors = IssueListItem.colors[props.selected ? "selected" : "normal"] || IssueListItem.colors.normal
      return colors[color]
    }

  return {
    divider: [PositionAbsolute, {
      left: 0,
      top: 0,
      right: 0,
      zIndex: 2,
      boxShadow: colorGetter("dividerBoxShadow")
    }],
    outline: [makeTransition("box-shadow",100),PositionAbsolute,Fill,{
      pointerEvents: "none",
      zIndex: 2,
      top: 0,
      left: 0,
      boxShadow: colorGetter("outline")
    }],
    root: [FillWidth, FlexColumn, PositionRelative, CursorPointer, {
      background: colorGetter("bg"),
      boxShadow: colorGetter("boxShadow"),
      [directChild('content')]: [FlexScale, FillHeight, FlexRow, makePaddingRem(0), {
        [directChild("main")]: [FlexScale, FlexColumn, PositionRelative, OverflowHidden, {
          [directChild("top")]: [FlexRow, FillWidth, makeHeightConstraint(rem(2.5)), makePaddingRem(0.3, 0.5, 0), {
            background: colorGetter("topBg"),
            alignItems: 'center',
            [directChild("title")]: [FlexScale, makePaddingRem(0, 0.5, 0, 0), Ellipsis, {
              fontSize: rem(1),
              "& > .number": [makePaddingRem(0, 0.4, 0, 0), {
                color: colorGetter("number")
              }]
            }],
            [directChild("updatedAt")]: [{
              flexGrow: 0,
              flexShrink: 2,
              minWidth: "15%",
              fontSize: rem(0.7),
              color: colorGetter("updatedAt"),
              textAlign: "right"
            }]
          }],
          [directChild("bottomRow")]: [FlexAuto, FillWidth, OverflowAuto, FlexRowCenter, makePaddingRem(0.3, 0.4, 0.5, 0), {
            [directChild("labelsContainer")]: [FlexScale, PositionRelative, makeMarginRem(0), {
              overflowY: "hidden",
              overflowX: "auto",
              [directChild("labels")]: [OverflowHidden, FlexRow, {
                overflowX: "visible",
                flexWrap: "nowrap"
              }]
            }]

          }]
        }],
        [directChild("secondary")]: [FlexAuto, PositionRelative, FillHeight, {
          [child("assignee")]: [Fill],
          [child("subAssignees")]: [PositionAbsolute, OverflowAuto, FlexRow, makeHeightConstraint(rem(2)), FillWidth, {
            justifyContent: "flex-end",
            [child("subAssignee")]: [makeDimensionConstraints(rem(2)), makePaddingRem(0, 0.3, 0, 0), {}]
          }]

        }]
      }]
    }]
    ,

    milestoneRoot: [{
      maxWidth: "50%",
      flexShrink: 2,
      marginRight: rem(0),
      marginLeft: rem(0)
    }],

    milestoneChip: [{
      marginTop: 0,
      marginBottom: 0
    }],

    //makeHeightConstraint(rem(1.8))
    labelsSpacer: [makeDimensionConstraints(rem(1))],

    labelChip: [FlexAuto, makeMarginRem(0, 0.5, 0, 0), {
      marginTop: 0,
      marginBottom: 0
    }],
    //makeDimensionConstraints(rem(1.5))
    labelAdd: [makePaddingRem(0, 0, 0, 0.25), {
      background: Milestone.colors.actionBg,
      borderRadius: rem(0.8),
      "& > .icon": [{
        "&,& > svg": [makeDimensionConstraints(rem(1))]
      }]
    }]
  }
}

interface P extends IThemedProperties {
  issue: IIssue
  index: number
  selected: boolean
}


export default StyledComponent(baseStyles, {withTheme: true})(function IssueListItem(props: P):React.ReactElement<P> {

  const
    {issue, index, classes, selected, style, theme, ...other} = props

  function onLabelsChanged(labels: Array<ILabel>): void {
    uiTask(async () => {
      const issue = await getIssue(props.issue.id)
      await patchIssueLabels(issue, labels)
    })
  }

  function onMilestoneSelected(milestone: IMilestone | null):void {
    uiTask(async () => {
      await patchIssueMilestone(props.issue.id, milestone)
    })
  }

  function onCollaboratorsSelected(collabs: Array<ICollaborator> | null):void {
    uiTask(async () => {
      await patchIssueAssignees(props.issue.id,collabs)
    })
  }

  //function renderContent(selected: boolean): React.ReactElement<P> {


    return <div
      style={style}
      className={mergeClasses(classes.root, selected && "selected")}
      {...other}
    >
      <Divider classes={{
        root: classes.divider
      }}/>
      <div className="content">
        <div className="main">
          <div className="top">
            <Typography className="title" component="div"><span className="number">#{issue.number}</span> {issue.title}
            </Typography>
            <Typography className="updatedAt" component="div">
              <Moment fromNow date={issue.updated_at}/>
            </Typography>
          </div>
          <FlexSpacer/>
          <div className="bottomRow">
            <Collaborators
              id={`issue-list-item-${issue.id}-collabs`}
              issue={issue}
              onSelected={onCollaboratorsSelected}
            />
            <Milestone
              id={`issue-list-item-${issue.id}-milestone`}
              milestone={issue.milestone}
              onSelected={onMilestoneSelected}
              classes={{
                chip: classes.milestoneChip,
                root: classes.milestoneRoot
              }}
            />
            <HorizontalScroll selector=".labels" shadow={{
              from: theme.components.IssueListItem.colors[selected ? "selected" : "normal"].labelScrollFade,
              to: Transparent,
              length: rem(1)
            }}>
              {containerRef =>
                <div ref={containerRef} className="labelsContainer">
                  <Labels
                    id={`issue-list-item-${issue.id}-labels`}
                    labels={issue.labels}
                    className="labels"
                    classes={{
                      chip: classes.labelChip,
                      //add: classes.labelAdd,
                      spacer: classes.labelsSpacer
                    }}
                    onChanged={onLabelsChanged}
                    editable
                  />
                </div>
              }
            </HorizontalScroll>
          </div>
        </div>
        {/*<div className="secondary" style={makeWidthConstraint(style.height)}>*/}
        {/*<Avatar square user={getValue(() => issue.assignees[0])} className="assignee"/>*/}
        {/*<div className="subAssignees">*/}
        {/*{getValue(() => issue.assignees.slice(1).map(user =>*/}
        {/*<Avatar key={user.id} user={user} className="subAssignee"/>*/}
        {/*))}*/}
        {/*</div>*/}
        {/*</div>*/}
      </div>

      {/*{selected && <div className="selected"/>}*/}
      <div className={classes.outline} />
    </div>

  // }
  //
  // return renderContent(selected)
})



