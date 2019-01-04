import * as React from "react"
import getLogger from "common/log/Logger"
import {
  child,
  directChild,
  Ellipsis, Fill, FillHeight,
  FillWidth,
  FlexAuto,
  FlexColumn, FlexRow, FlexRowCenter,
  FlexScale,
  IThemedProperties, makeDimensionConstraints,
  makeHeightConstraint, makeMarginRem,
  makePaddingRem, makeTransition, makeWidthConstraint, OverflowAuto, OverflowHidden, PositionAbsolute, PositionRelative,
  rem,
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
import {Milestone as MilestoneIcon, Tag as TagIcon} from '@githubprimer/octicons-react'
import IconButton from "@material-ui/core/IconButton"
import {darken} from "@material-ui/core/styles/colorManipulator"
import BaseChip from "renderer/components/elements/BaseChip"
const Octicon = require("@githubprimer/octicons-react").default
const log = getLogger(__filename)


function baseStyles(theme):any {
  const
    {palette, components: {IssueListItem, Milestone}} = theme,
    {primary, secondary} = palette
  
  return {
    root: [FillWidth, FlexColumn, PositionRelative, {
      [child("divider")]: [PositionAbsolute,{
        left:0,
        top: 0,
        right: 0,
        zIndex: 2,
        boxShadow: IssueListItem.colors.dividerBoxShadow
      }],
      background: IssueListItem.colors.bg,
      boxShadow: IssueListItem.colors.boxShadow,
      [directChild('content')]: [FlexScale, FillHeight, FlexRow, makePaddingRem(0), {
        [directChild("main")]: [FlexScale,FlexColumn, PositionRelative, OverflowHidden, {
          [directChild("top")]: [FlexRow,FillWidth,makeHeightConstraint(rem(2)), makePaddingRem(0, 0.5, 0),{
            background: IssueListItem.colors.topBg,
            alignItems: 'center',
            [directChild("title")]: [FlexScale, makePaddingRem(0,0.5,0,0), Ellipsis, {
              fontSize: rem(1),
              "& > .number": [makePaddingRem(0, 0.4, 0, 0), {
                color: IssueListItem.colors.number
              }]
            }],
            [directChild("updatedAt")]: [FlexAuto,{
              fontSize: rem(0.7),
              color: IssueListItem.colors.updatedAt
            }],
          }],
          [directChild("bottomRow")]: [FlexAuto,FillWidth, OverflowAuto, FlexRowCenter, makePaddingRem(0.3,0.5,0.5), {
            [directChild("labels")]: [FlexScale,makeMarginRem(0, 0.5), {}],
            [directChild("button")]: [makeTransition(["color","background-color"]),FlexAuto,makeMarginRem(0, 0.2), makePaddingRem(0.6),{
              fontSize: rem(1),
              color: darken(primary.contrastText,0.4),
              "&:hover": [{
                color: primary.contrastText,
              }]
            }],
            
          }]
        }],
        [directChild("secondary")]: [FlexAuto, PositionRelative, FillHeight, {
          [child("assignee")]: [Fill],
          [child("subAssignees")]: [PositionAbsolute, OverflowAuto, FlexRow, makeHeightConstraint(rem(2)), FillWidth, {
            justifyContent: "flex-end",
            [child("subAssignee")]: [makeDimensionConstraints(rem(2)), makePaddingRem(0, 0.3, 0, 0), {}],
          }]
          
        }]
      }]
    }],
  
    milestoneChip: [PositionRelative,FlexRowCenter, makeHeightConstraint(rem(1.8)), {
      maxWidth: "25%",
      marginTop: 0,
      marginBottom: 0
    }],
    milestoneLabel: [FlexScale,OverflowHidden,Ellipsis,PositionRelative, makePaddingRem(0,1.8,0,1.2), {
      display: "block",
    }],
  
    milestoneAction: [makeDimensionConstraints(rem(1.5)),makePaddingRem(0.25),{
      background: Milestone.colors.actionBg,
      borderRadius: rem(0.8),
      "& > .icon": [{
        "&,& > svg": [makeDimensionConstraints(rem(1))]
      }]
    }],
    
    labelChip: [makeHeightConstraint(rem(1.8)), makeMarginRem(0,0.5,0,0), {
      marginTop: 0,
      marginBottom: 0
    }],
    labelAdd: [makeDimensionConstraints(rem(1.5)),makePaddingRem(0.25),{
      background: Milestone.colors.actionBg,
      borderRadius: rem(0.8),
      "& > .icon": [{
        "&,& > svg": [makeDimensionConstraints(rem(1))]
      }]
    }]
  }
}

interface P extends IThemedProperties {
  issue:IIssue
}

interface S {

}

@withStatefulStyles(baseStyles,{withTheme: true})
export default class IssueListItem extends React.Component<P, S> {
  
  constructor(props:P) {
    super(props)
    
    this.state = {}
  }
  
  private onAdd = (label:ILabel):void => {
    log.info("Add label", label)
  }
  
  private onChangeMilestone = () => {
    log.info("Change milestone")
  }
  
  render() {
    const {issue, classes, style, theme,...other} = this.props
    return <div
      style={style}
      className={classes.root}
      
      {...other}
    >
      <Divider className="divider"/>
      <div className="content">
        <div className="main">
          <div className="top">
            <Typography className="title" component="div"><span className="number">#{issue.number}</span> {issue.title}</Typography>
            <Typography className="updatedAt" component="div">
              Updated <Moment fromNow date={issue.updated_at}/>
            </Typography>
          </div>
          <FlexSpacer/>
          <div className="bottomRow">
            <Labels
              labels={issue.labels}
              className="labels"
              classes={{chip: classes.labelChip, add: classes.labelAdd}}
              onAdd={this.onAdd}
            />
            <BaseChip
              color={theme.components.Milestone.colors.bg}
              label={getValue(() => issue.milestone.title,"Not Set")}
              actionIcon={<div className={classes.milestoneAction}>
                <Octicon className="icon" icon={MilestoneIcon} />
                </div>}
              onAction={this.onChangeMilestone}
              classes={{
                chip: classes.milestoneChip,
                label: classes.milestoneLabel
              }}
            />
          </div>
        </div>
        <div className="secondary" style={makeWidthConstraint(style.height)}>
          <Avatar square user={getValue(() => issue.assignees[0])} className="assignee"/>
          <div className="subAssignees">
            {getValue(() => issue.assignees.slice(1).map(user =>
              <Avatar key={user.id} user={user} className="subAssignee"/>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  }
}



