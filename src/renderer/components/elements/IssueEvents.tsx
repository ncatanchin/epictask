import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles,
  NestedStyles,
  mergeClasses
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue, IIssueEvent, UIIssueEventTypes} from "common/models/Issue"
import {
  IIssueEventData,
  IIssueEventTimelineItem, IssueEventTimelineItemPayloadType,
  IssueEventTimelineItemType,
  isTimelineComment
} from "renderer/net/IssueAPI"
import {IComment} from "common/models/Comment"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import {getValue} from "typeguard"
import Avatar from "renderer/components/elements/Avatar"
import moment from "moment"
import {GithubDate, uiGithubDate} from "renderer/util/UIHelper"
import Label from "renderer/components/elements/Label"
import Milestone from "renderer/components/elements/Milestone"

import * as Octicons from "@githubprimer/octicons-react"
import {IUser} from "common/models/User"

const Octicon = require("@githubprimer/octicons-react").default

const log = getLogger(__filename)


interface IssueEventsProps extends IThemedProperties {
  issue: IIssue
  data: IIssueEventData
}


interface IssueTimelineEventProps<K extends IssueEventTimelineItemType = any, Payload = IssueEventTimelineItemPayloadType<K>> extends IThemedProperties {
  last: boolean
  issue: IIssue
  event: IIssueEventTimelineItem<K, Payload>
}

type IssueTimelineEventComponentType<K extends IssueEventTimelineItemType = any> = { [K in IssueEventTimelineItemType]: (props: IssueTimelineEventProps<K>) => React.ReactElement<IssueTimelineEventProps<K>> }

const IssueTimelineEventComponents: IssueTimelineEventComponentType = {
  comment: IssueComment,
  activity: IssueActivity
}

export default StyledComponent(baseStyles)(function IssueEvents(props: IssueEventsProps): React.ReactElement<IssueEventsProps> {
  const {classes, issue, data: {timeline}} = props

  return <div className={classes.events}>
    <div className="items">
    {timeline.map((timelineEvent, index) => {
      const Component = IssueTimelineEventComponents[timelineEvent.type]
      return <Component
        key={timelineEvent.payload.id}
        classes={classes}
        issue={issue}
        event={timelineEvent}
        last={index === timeline.length - 1}
      />
    })}
    </div>
  </div>
})

interface IActivityAvatarProps extends IThemedProperties {
  user:IUser
}

function ActivityAvatar({user,...other}:IActivityAvatarProps):React.ReactElement<any> {
  return <Avatar chip={false} variant="small" user={user} {...other}/>
}

function makeAssignedActivityLine(action: "unassigned" | "assigned", event: IIssueEvent): React.ReactElement<any> {
  return <>
    <ActivityAvatar user={event.actor}/>
    &nbsp;
    {action === "assigned" ? "assigned to" : "unassigned from"}
    &nbsp;&nbsp;
    {event.assignees ?
      event.assignees.map(assignee => <ActivityAvatar key={`${event.id}-${assignee.id}`} user={assignee}/>) :
      event.assignee ? <ActivityAvatar user={event.assignee}/> :
        <ActivityAvatar user={event.payload as IUser}/>
    }
    &nbsp;at&nbsp;
    <GithubDate timestamp={event.created_at}/>
  </>

}

function makeLabelActivityLine(action: "removed" | "added", event: IIssueEvent): React.ReactElement<any> {
  return <>
    <ActivityAvatar user={event.actor}/>&nbsp;{action} label &nbsp;
    {!event.labels ?
      <>
        <Label key={event.id} label={event.label}/>&nbsp;
      </> :
      event.labels.map(label => <>
        <Label key={label.id} label={label}/>&nbsp;
      </>)
    } at&nbsp;<GithubDate timestamp={event.created_at}/>
    </>

}

function makeMilestoneActivityLine(action: "removed" | "added", event: IIssueEvent): React.ReactElement<any> {
  return <>
    <ActivityAvatar user={event.actor}/>&nbsp;{action === "added" ? "added to milestone" : "removed from milestone"}&nbsp;
    <Milestone
      id={`issue-event-${event.id}`}
      key={event.id}
      editable={false}
      milestone={event.milestone}
    />&nbsp;at&nbsp;<GithubDate timestamp={event.created_at}/>
  </>

}

const IssueActivityBodyConfigs: { [key in UIIssueEventTypes]: [Octicons.Icon, (classes: any, issue: IIssue, event: IIssueEvent) => React.ReactElement<any>] } = {
  assigned: [Octicons.Person, (classes: any, issue: IIssue, event: IIssueEvent) => makeAssignedActivityLine("assigned", event)],
  unassigned: [Octicons.Person, (classes: any, issue: IIssue, event: IIssueEvent) => makeAssignedActivityLine("unassigned",event)],
  labeled: [Octicons.Tag, (classes: any, issue: IIssue, event: IIssueEvent) => makeLabelActivityLine("added", event)],
  unlabeled: [Octicons.Tag, (classes: any, issue: IIssue, event: IIssueEvent) => makeLabelActivityLine("removed",event)],
  milestoned: [Octicons.Milestone, (classes: any, issue: IIssue, event: IIssueEvent) => makeMilestoneActivityLine("added",event)],
  demilestoned: [Octicons.Milestone, (classes: any, issue: IIssue, event: IIssueEvent) => makeMilestoneActivityLine("removed",event)]
}

function IssueActivity(props: IssueTimelineEventProps<"activity">): React.ReactElement<IssueTimelineEventProps<"activity">> {
  const
    {classes, issue, event, last} = props,
    activity = event.payload,
    config = IssueActivityBodyConfigs[activity.event]

  if (!config) {
    log.warn("Skipping, no builder", activity)
    return null
  }

  const [Icon, Builder] = config

  return <div key={activity.id} className="activity">
    <div className="connection">
      <div className={mergeClasses("line", last && "last")}/>
      <Octicon className="icon" icon={Icon}/>
    </div>
    <div className="content">
      {Builder(classes, issue, activity)}
    </div>
    <div className="bottom"/>
  </div>
}


function IssueComment(props: IssueTimelineEventProps<"comment">): React.ReactElement<IssueTimelineEventProps<"comment">> {
  const
    {classes, event, last} = props,
    comment = event.payload

  return <div key={comment.id} className="comment">
    <div className="container">
      <div className="content">
        <div className="top">
          <div className="text">
            <Avatar user={comment.user} text picture={false}/> - commented on {uiGithubDate(comment.created_at)}
          </div>
        </div>
        <div className="bottom">
          <div className="text">{comment.body}</div>
        </div>
      </div>
    </div>
    <div className="creator">
      <Avatar square user={getValue(() => comment.user)} className="avatar"/>
    </div>
    <div className={mergeClasses("connection", last && "last")}/>
  </div>
}






