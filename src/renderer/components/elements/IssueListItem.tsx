import * as React from "react"
import {useCallback, useEffect, useState} from "react"
import getLogger from "common/log/Logger"
import {
  child,
  CursorPointer,
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
  mergeClasses,
  OverflowAuto,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative,
  rem,
  Transparent
} from "renderer/styles/ThemedStyles"
import {IIssue} from "common/models/Issue"
import {Typography} from "@material-ui/core"
import Divider from "@material-ui/core/Divider"
import {FlexSpacer} from "renderer/components/elements/FlexSpacer"
import Labels from "renderer/components/elements/Labels"
import {ILabel} from "common/models/Label"
import Moment from "react-moment"
import Milestone from "./Milestone"
import {IMilestone} from "common/models/Milestone"
import {getIssue, patchIssueAssignees, patchIssueLabels, patchIssueMilestone} from "renderer/net/IssueAPI"
import {uiTask} from "renderer/util/UIHelper"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {Color} from "csstype"
import HorizontalScroll from "renderer/components/elements/HorizontalScroll"
import Collaborators from "renderer/components/elements/Collaborators"
import {ICollaborator} from "common/models/Repo"
import {PrimitiveDot as DotIcon} from "@githubprimer/octicons-react"
import IssueStateLabel from "renderer/components/elements/IssueStateLabel"
import {shortId} from "common/IdUtil"

const
  Octicon = require("@githubprimer/octicons-react").default,
  log = getLogger(__filename)

declare global {
  type IssueListItemColor = "bg" |
    "number" |
    "updatedAt" |
    "topBg" |
    "outline" |
    "boxShadow" |
    "dividerBoxShadow" |
    "text" |
    "marker" |
    "metadata"

  type IssueListItemColors = { [key in IssueListItemColor]: Color }

  interface IIssueListItemStyles {
    colors: {
      normal: IssueListItemColors,
      selected: IssueListItemColors
    }
  }
}

export type IssueListItemVariant = "header" | "listItem"

function getColorCode({selected, info, issue}: P): string {
  return selected ?
    "selected" :
    info ?
      "info" :
      "normal"
  // return selected || info ?
  //   (issue.pull_request ? "pr" : (issue.state || "open")) :
  //   "normal"
}

function baseStyles(theme): any {
  const
    {palette, components: {IssueListItem, Milestone}} = theme,
    colorGetter = (color: IssueListItemColor): ((props: P) => Color) => (props: P) => {
      const
        type = getColorCode(props),
        colors = IssueListItem.colors[type] || IssueListItem.colors.normal

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
    boxShadow: [makeTransition("box-shadow", 100), PositionAbsolute, Fill, {
      pointerEvents: "none",
      zIndex: 2,
      top: 0,
      left: 0,
      //boxShadow: colorGetter("outline"),
      boxShadow: colorGetter("boxShadow")
    }],
    root: [FillWidth, FlexColumn, PositionRelative, CursorPointer, {
      color: colorGetter("text"),
      // "&, & *": {
      //   color: colorGetter("text")
      // },
      "&.info": [{
        minHeight: rem(5.5)
      }],
      background: colorGetter("bg"),
      [directChild('content')]: [FlexScale, FillHeight, FlexRow, makePaddingRem(0), {
        [directChild("main")]: [FlexScale, FlexColumn, PositionRelative, OverflowHidden, {
          [directChild("top")]: [FlexRow, FillWidth, makeHeightConstraint(rem(2.5)), makePaddingRem(0.3, 0.5, 0), {
            background: colorGetter("topBg"),
            alignItems: 'center',
            [directChild("title")]: [FlexScale, makePaddingRem(0, 0.5, 0, 1), Ellipsis, {
              fontSize: rem(1.2),
              fontWeight: 500,
              color: colorGetter("text")
            }],
            [directChild("metadata")]: [FlexAuto, {
              fontSize: rem(0.9),
              color: colorGetter("metadata")
            }],
            [directChild("dot")]: [FlexAuto, makePaddingRem(0, 0.5), {
              color: colorGetter("metadata"),
              fontSize: rem(0.3),
              ["& svg"]: [makeDimensionConstraints(rem(0.3))]
            }]
            // [directChild("updatedAt")]: [FlexAuto,{
            //   fontSize: rem(0.7),
            //   color: colorGetter("updatedAt"),
            //   textAlign: "right"
            // }]
          }],
          [directChild("bottomRow")]: [FlexAuto, FillWidth, OverflowAuto, FlexRowCenter, makePaddingRem(0.3, 0.4, 0.5, 0.7), {
            // paddingLeft: theme.spacing.unit,
            [directChild("labelsContainer")]: [FlexScale, PositionRelative, makeMarginRem(0), {
              // overflowY: "visible",
              overflowX: "auto",
              [directChild("labels")]: [FlexRow, {
                // overflowY: "visible",
                // overflowX: "visible",
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

    collabRoot: [{
      paddingRight: 0
    }],
    milestoneRoot: [{
      maxWidth: "50%",
      flexShrink: 2,
      marginRight: rem(0),
      marginLeft: theme.spacing.unit
    }],

    milestoneChip: [{
      marginTop: 0,
      marginBottom: 0
    }],

    //makeHeightConstraint(rem(1.8))
    labelsSpacer: [makeDimensionConstraints(theme.spacing.unit)],

    labelChip: [FlexAuto, makeMarginRem(0), {
      marginRight: theme.spacing.unit
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
  variant?: IssueListItemVariant
  issue: IIssue
  selected?: boolean
  info?: boolean
}


export default StyledComponent<P>(baseStyles, {withTheme: true})(function IssueListItem(props: P): React.ReactElement<P> {

  const
    {issue, classes, selected = false, info = false, style, theme, ...other} = props,
    [prefix, setPrefix] = useState<string>(shortId),
    onLabelsChanged = useCallback((labels: Array<ILabel>): void => {
      uiTask("Updating Labels", async () => {
        await patchIssueLabels(await getIssue(issue.id), labels)
      })
    }, [issue]),
    onMilestoneSelected = useCallback((milestone: IMilestone | null): void => {
      uiTask("Updating Milestone", async () => {
        await patchIssueMilestone(issue.id, milestone)
      })
    }, [issue]),
    onCollaboratorsSelected = useCallback((collabs: Array<ICollaborator> | null): void => {
      uiTask("Updating Assignees", async () => {
        await patchIssueAssignees(issue.id, collabs)
      })
    }, [issue])


  useEffect(() => setPrefix(shortId()), [issue.id])

  return <div
    style={style}
    className={mergeClasses(classes.root, selected && "selected", info && "info")}
    {...other}
  >
    {!info && <Divider classes={{
      root: classes.divider
    }}/>}
    <div className="content">
      <div className="main">
        <div className="top">
          <IssueStateLabel variant={selected ? "inherit" : "normal"} issue={issue}/>
          <Typography className="title" component="div">{issue.title}
          </Typography>
          <Typography className="metadata" component="div">
            #{issue.number}
          </Typography>
          <div className="dot">
            <Octicon icon={DotIcon}/>
          </div>
          <Typography className="metadata" component="div">
            <Moment fromNow date={issue.updated_at}/>
          </Typography>
        </div>
        <FlexSpacer/>
        <div className="bottomRow">
          <Collaborators
            id={`issue-list-item-${prefix}-${issue.id}-collabs`}
            issue={issue}
            onSelected={onCollaboratorsSelected}
            compact
          />
          <Milestone
            id={`issue-list-item-${prefix}-${issue.id}-milestone`}
            milestone={issue.milestone}
            onSelected={onMilestoneSelected}
            classes={{
              chip: classes.milestoneChip,
              root: classes.milestoneRoot
            }}
          />
          <HorizontalScroll selector=".labels" shadow={{
            from: theme.components.IssueListItem.colors[getColorCode(props)].labelScrollFade,
            to: Transparent,
            length: rem(1)
          }}>
            {containerRef =>
              <div ref={containerRef} className="labelsContainer">
                <Labels
                  id={`issue-${prefix}-list-item-${issue.id}-labels`}
                  labels={issue.labels}
                  className="labels"
                  classes={{
                    chip: classes.labelChip,
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
    </div>

    <div className={classes.boxShadow}/>
  </div>

  // }
  //
  // return renderContent(selected)
})



