import * as React from "react"
import Avatar from "renderer/components/elements/Avatar"
import {IIssueEvent} from "common/models/Issue"
import {IUser} from "common/models/User"
import {GithubDate} from "renderer/util/UIHelper"
import Label from "renderer/components/elements/Label"
import Milestone from "renderer/components/elements/Milestone"
import {IThemedProperties} from "renderer/styles/ThemedStyles"

export interface IActivityAvatarProps extends IThemedProperties {
  user: IUser
}


export function ActivityAvatar({user, ...other}: IActivityAvatarProps): React.ReactElement<any> {
  return <Avatar chip={false} variant="small" user={user} {...other}/>
}

export function makeAssignedActivityLine(classes:any, action: "unassigned" | "assigned", event: IIssueEvent): React.ReactElement<any> {
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

export function makeLabelActivityLine(classes:any,action: "removed" | "added", event: IIssueEvent): React.ReactElement<any> {
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

export function makeMentionedActivityLine(classes:any,action: "mentioned" | "referenced", event: IIssueEvent): React.ReactElement<any> {
  return <>
    <ActivityAvatar user={event.actor}/>&nbsp;{action} at&nbsp;
    <GithubDate timestamp={event.created_at}/>
  </>
}

export function makeOpenStateActivityLine(classes:any,action: "closed" | "reopened", event: IIssueEvent): React.ReactElement<any> {
  return <>
    <ActivityAvatar user={event.actor}/>&nbsp;{action} at&nbsp;
    <GithubDate timestamp={event.created_at}/>
  </>
}

export function makeRenamedActivityLine(classes:any,action: "renamed", event: IIssueEvent): React.ReactElement<any> {
  return <>
    <ActivityAvatar user={event.actor}/>&nbsp;{action} at&nbsp;
    <GithubDate timestamp={event.created_at}/>
  </>
}

export function makeMilestoneActivityLine(classes:any,action: "removed" | "added", event: IIssueEvent): React.ReactElement<any> {
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

export function makeSubscribedActivityLine(classes:any, action: "subscribed" | "unsubscribed", event: IIssueEvent): React.ReactElement<any> {
  return <>
    <ActivityAvatar user={event.actor}/>
    &nbsp;
    {action === "subscribed" ? "subscribed" : "unsubscribed"}
    &nbsp;at&nbsp;
    <GithubDate timestamp={event.created_at}/>
  </>

}
