import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  mergeClasses
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {
  IIssue,
  IIssueEvent,
  IIssueEventData, IIssueEventTimelineItem,
  IssueEventTimelineItemPayloadType,
  IssueEventTimelineItemType,
  UIIssueEventTypes
} from "common/models/Issue"
import {
  isTimelineComment, patchComment, patchIssue
} from "renderer/net/IssueAPI"
import {IComment, isComment} from "common/models/Comment"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import {getValue} from "typeguard"
import Avatar from "renderer/components/elements/Avatar"
import {GithubDate, uiGithubDate} from "renderer/util/UIHelper"
import Label from "renderer/components/elements/Label"
import Milestone from "renderer/components/elements/Milestone"

import * as Octicons from "@githubprimer/octicons-react"
import {IUser} from "common/models/User"
import MarkdownView from "renderer/components/markdown/MarkdownView"
import {hasEditPermission} from "common/Security"
import {useCallback, useContext, useEffect, useState} from "react"
import EditBody, {BodyType} from "renderer/components/markdown/EditBody"
import {FocusedTimelineIdContext} from "renderer/components/elements/IssueViewContext"

const Octicon = require("@githubprimer/octicons-react").default

const log = getLogger(__filename)


interface IssueEventsProps extends IThemedProperties {
  issue: IIssue
  data: IIssueEventData
}


interface IssueTimelineEventProps<K extends IssueEventTimelineItemType = any, Payload = IssueEventTimelineItemPayloadType<K>> extends IThemedProperties {
  last: boolean
  readonly?: boolean
  first?: boolean
  issue: IIssue
  event?: IIssueEventTimelineItem<K, Payload>
}

type IssueTimelineEventComponentType<K extends IssueEventTimelineItemType = any> = { [K in IssueEventTimelineItemType]: (props: IssueTimelineEventProps<K>) => React.ReactElement<IssueTimelineEventProps<K>> }

const IssueTimelineEventComponents: IssueTimelineEventComponentType = {
  comment: IssueComment,
  activity: IssueActivity
}

export default StyledComponent<IssueEventsProps>(baseStyles)(function IssueEvents(props: IssueEventsProps): React.ReactElement<IssueEventsProps> {
  const {classes, issue, data: {timeline}} = props

  return <div className={classes.events}>
    <div className="items">

      <IssueComment last={!timeline.length} first issue={issue}/>
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
  user: IUser
}

function ActivityAvatar({user, ...other}: IActivityAvatarProps): React.ReactElement<any> {
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
    <ActivityAvatar
      user={event.actor}/>&nbsp;{action === "added" ? "added to milestone" : "removed from milestone"}&nbsp;
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
  unassigned: [Octicons.Person, (classes: any, issue: IIssue, event: IIssueEvent) => makeAssignedActivityLine("unassigned", event)],
  labeled: [Octicons.Tag, (classes: any, issue: IIssue, event: IIssueEvent) => makeLabelActivityLine("added", event)],
  unlabeled: [Octicons.Tag, (classes: any, issue: IIssue, event: IIssueEvent) => makeLabelActivityLine("removed", event)],
  milestoned: [Octicons.Milestone, (classes: any, issue: IIssue, event: IIssueEvent) => makeMilestoneActivityLine("added", event)],
  demilestoned: [Octicons.Milestone, (classes: any, issue: IIssue, event: IIssueEvent) => makeMilestoneActivityLine("removed", event)]
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


export function IssueComment(props: IssueTimelineEventProps<"comment">): React.ReactElement<IssueTimelineEventProps<"comment">> {
  const
    {classes, event, issue, last, first = false, readonly = false} = props,
    comment = event && event.payload as IComment | null,
    [id, user, body, created_at, updated_at] =
      ["id", "user", "body", "created_at", "updated_at"].map(prop => event ? event.payload[prop] : issue[prop]),
    canEdit = !readonly && hasEditPermission(getValue(() => event.payload) || issue),
    [inEditMode, setInEditMode] = useState<boolean>(false),
    onSetInEditMode = useCallback(() => setInEditMode(true), [inEditMode]),
    focusedTimelineId = useContext(FocusedTimelineIdContext),
    focused = focusedTimelineId > 0 && focusedTimelineId === getValue(() => comment.id, issue.id)


  const
    onSave = useCallback(async (type:BodyType, issue: IIssue, object:Partial<IIssue> | Partial<IComment>, objectId:number,source:string):Promise<void> => {
      log.debug("Saving",type,source,event,issue)
      if (type === "comment") {
        await patchComment(issue,objectId,source)
        setInEditMode(false)
      } else {
        await patchIssue(objectId,{body: source})
        setInEditMode(false)
      }

    },[issue,event]),
    onCancel = useCallback(():void => {
      setInEditMode(false)
    },[issue,event])

  return <div key={id} id={`issue-view-content-${id}`} className={mergeClasses("comment", first && "first", focused && "focused")}>
    <div className="commentInternal">
    {first && !last && <div className={mergeClasses("connection","first")}/>}
    <div className={mergeClasses("container", first && "first", focused && "focused")}>
      <div className={mergeClasses("content")}>
        <div className="top">
          <div className="text">
            <Avatar user={user} text picture={false}/> - created at {uiGithubDate(created_at || updated_at)}
          </div>
        </div>
        <div className={mergeClasses("bottom",inEditMode && "edit")}>
          <div className={mergeClasses("text",inEditMode && "edit")}>
            {inEditMode ?
              <EditBody
                type={comment ? "comment" : "issue"}
                issue={issue}
                objectId={comment ? comment.id : issue.id}
                object={comment || issue}
                onSave={onSave}
                onCancel={onCancel}
              /> :
              <>
              <MarkdownView source={body || "No content provided"}/>
                {canEdit && <div className="editButton" onClick={onSetInEditMode}>
                  <Octicon icon={Octicons.Pencil}/>
                </div>}
                </>
            }

            </div>
        </div>
      </div>
    </div>
    <div className={mergeClasses("creator", first && "first", focused && "focused")}>
      <Avatar square user={getValue(() => user)} className={mergeClasses("avatar", focused && "focused")}/>
    </div>
    <div className={mergeClasses("connection", last && "last")}/>
    </div>
  </div>
}






