import * as React from "react"
import {useCallback, useContext, useRef} from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, mergeClasses} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {
  IIssue,
  IIssueEvent,
  IIssueEventData,
  IIssueEventTimelineItem,
  IssueEventTimelineItemPayloadType,
  IssueEventTimelineItemType,
  UIIssueEventTypes
} from "common/models/Issue"
import {createComment, patchComment, patchIssue} from "renderer/net/IssueAPI"
import {IComment} from "common/models/Comment"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import {getValue} from "typeguard"
import Avatar from "renderer/components/elements/Avatar"
import {uiGithubDate, uiTask} from "renderer/util/UIHelper"

import * as Octicons from "@githubprimer/octicons-react"
import MarkdownView from "renderer/components/markdown/MarkdownView"
import {hasEditPermission} from "common/Security"
import EditBody, {BodyType} from "renderer/components/markdown/EditBody"
import {
  DirtyDataContext,
  DirtyDataInterceptorClient,
  DirtyDataProvided,
  withDirtyDataInterceptor
} from "renderer/components/DirtyDataInterceptor"
import {
  makeAssignedActivityLine,
  makeLabelActivityLine,
  makeMentionedActivityLine,
  makeMilestoneActivityLine,
  makeOpenStateActivityLine,
  makeRenamedActivityLine, makeSubscribedActivityLine
} from "renderer/components/elements/IssueEventActivities"
import {useController} from "renderer/controllers/Controller"
import IssueViewController from "renderer/controllers/IssueViewController"
import * as _ from 'lodash'
const
  Octicon = require("@githubprimer/octicons-react").default,
  log = getLogger(__filename)

const IssueActivityBodyConfigs: { [key in UIIssueEventTypes]: [Octicons.Icon, (classes: any, issue: IIssue, event: IIssueEvent) => React.ReactElement<any>] } = {
  mentioned: [Octicons.Mention, (classes: any, issue: IIssue, event: IIssueEvent) => makeMentionedActivityLine(classes, "mentioned", event)],
  referenced: [Octicons.Mention, (classes: any, issue: IIssue, event: IIssueEvent) => makeMentionedActivityLine(classes, "referenced", event)],
  closed: [Octicons.Mention, (classes: any, issue: IIssue, event: IIssueEvent) => makeOpenStateActivityLine(classes, "closed", event)],
  renamed: [Octicons.Mention, (classes: any, issue: IIssue, event: IIssueEvent) => makeRenamedActivityLine(classes, "renamed", event)],
  reopened: [Octicons.Mention, (classes: any, issue: IIssue, event: IIssueEvent) => makeOpenStateActivityLine(classes, "reopened", event)],
  subscribed: [Octicons.Person, (classes: any, issue: IIssue, event: IIssueEvent) => makeSubscribedActivityLine(classes, "subscribed", event)],
  unsubscribed: [Octicons.Person, (classes: any, issue: IIssue, event: IIssueEvent) => makeSubscribedActivityLine(classes, "unsubscribed", event)],
  assigned: [Octicons.Person, (classes: any, issue: IIssue, event: IIssueEvent) => makeAssignedActivityLine(classes, "assigned", event)],
  unassigned: [Octicons.Person, (classes: any, issue: IIssue, event: IIssueEvent) => makeAssignedActivityLine(classes, "unassigned", event)],
  labeled: [Octicons.Tag, (classes: any, issue: IIssue, event: IIssueEvent) => makeLabelActivityLine(classes, "added", event)],
  unlabeled: [Octicons.Tag, (classes: any, issue: IIssue, event: IIssueEvent) => makeLabelActivityLine(classes, "removed", event)],
  milestoned: [Octicons.Milestone, (classes: any, issue: IIssue, event: IIssueEvent) => makeMilestoneActivityLine(classes, "added", event)],
  demilestoned: [Octicons.Milestone, (classes: any, issue: IIssue, event: IIssueEvent) => makeMilestoneActivityLine(classes, "removed", event)]
}


interface IssueEventsProps extends IThemedProperties {
  issue: IIssue
  data: IIssueEventData
}


interface IssueTimelineEventProps<K extends IssueEventTimelineItemType = any,
  Payload = IssueEventTimelineItemPayloadType<K>,
  KN extends IssueEventTimelineItemType = any,
  PayloadN = IssueEventTimelineItemPayloadType<KN>> extends IThemedProperties {
  last: boolean
  readonly?: boolean
  first?: boolean
  newComment?: boolean
  issue: IIssue
  event?: IIssueEventTimelineItem<K, Payload>
  nextEvent?: IIssueEventTimelineItem<KN, PayloadN> | null
}

type IssueTimelineEventComponentType<K extends IssueEventTimelineItemType = any> = { [K in IssueEventTimelineItemType]: (props: IssueTimelineEventProps<K>) => React.ReactElement<IssueTimelineEventProps<K>> }

const IssueTimelineEventComponents: IssueTimelineEventComponentType = {} as any


export default StyledComponent<IssueEventsProps>(baseStyles)(function IssueEvents(props: IssueEventsProps): React.ReactElement<IssueEventsProps> {
  const
    {classes, issue, data: {timeline}} = props,
    [controller, updateController] = useController<IssueViewController>(),
    hasNewComment = controller.isNewComment()

  return <div className={classes.events}>
    <div className="items">

      {/* ISSUE DESCRIPTION */}
      <IssueContentBody classes={classes} last={!timeline.length && !hasNewComment} first issue={issue}/>

      {/* ALL COMMENTS AND OTHER EVENTS */}
      {timeline.map((timelineEvent, index) => {
        const Component = IssueTimelineEventComponents[timelineEvent.type]

        return <Component
          key={timelineEvent.payload.id}
          classes={classes}
          issue={issue}
          event={timelineEvent}
          nextEvent={timeline[index + 1]}
          last={index === timeline.length - 1 && !hasNewComment}
        />
      })}

      {hasNewComment &&
      <IssueContentBody classes={classes} last newComment issue={issue}/>
      }
    </div>
  </div>
})


function IssueActivity(props: IssueTimelineEventProps<"activity">): React.ReactElement<IssueTimelineEventProps<"activity">> {
  const
    {classes, issue, event, nextEvent, last} = props,
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
    {(!nextEvent || nextEvent.type !== "comment") &&
    <div className="bottom"/>}
  </div>
}


export const IssueContentBody = withDirtyDataInterceptor()((props: IssueTimelineEventProps<"comment">): React.ReactElement<IssueTimelineEventProps<"comment">> => {
  const
    dirtyDataContext = useContext(DirtyDataContext),
    {classes, newComment, event, issue, last, first = false, readonly = false} = props,
    comment = event && event.payload as IComment | null,
    containerRef = useRef<HTMLDivElement | null>(null),
    [id, user, body, created_at, updated_at] =
      ["id", "user", "body", "created_at", "updated_at"].map(prop => event ? event.payload[prop] : issue[prop]),
    [controller, updateController] = useController<IssueViewController>(),
    setEditingContentId = useCallback((newId: number) => {
      updateController(controller.setEditContentId(newId))
    }, [controller, updateController]),
    onEditClick = useCallback((event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()
      setEditingContentId(id)
    }, [setEditingContentId]),
    canEdit = !readonly && hasEditPermission(getValue(() => event.payload) || issue),
    inEditMode = newComment || (containerRef.current && (newComment || controller.editContentId === id)),
    focusedTimelineId = controller.focusedContentId,
    focused = focusedTimelineId > 0 && focusedTimelineId === getValue(() => comment.id, issue.id)

  const
    onSave = useCallback((type: BodyType, issue: IIssue, object: Partial<IIssue> | Partial<IComment>, objectId: number, source: string): void => {
      log.debug("Saving", type, source, event, issue)
      const
        handlers: { [type:string]: [string,() => Promise<any>] } = {
          newComment: ["Creating Comment", () => createComment(issue, source)],
          comment: ["Updating Comment", () => patchComment(issue, objectId, source)],
          default: ["Saving Issue", () => patchIssue(objectId, {body: source})]
        },
        [description, fn] = handlers[type] || handlers.default


      uiTask(description,async () => {
        await fn()
        setEditingContentId(-1)
      })

    }, [setEditingContentId, issue, event, controller]),
    onCancel = useCallback((): void => {
      setEditingContentId(-1)
    }, [setEditingContentId, issue, event]),
    onClick = useCallback((): void => {

      updateController(controller.setFocusedContentId(id))

    }, [controller, updateController, id]),
    onDirty = useCallback((newDirty: boolean): void => {

      updateController(controller.setIsDirtyContent(newDirty))

    }, [controller, updateController, id]),
    extraProps = controller.isEditingContent() ? {} : {onClick},
    wrapperRef = useRef<Element>(null),
    changeSet = [wrapperRef.current, controller, updateController, containerRef.current, inEditMode],
    clearEdit = useCallback((): void => {
      updateController(controller.setEditContentId(-1))
    }, changeSet),
    ignore = useCallback(async (_client: DirtyDataInterceptorClient, _event: Event): Promise<void> => {
      clearEdit()
    }, changeSet),
    shouldConfirm = useCallback((_client: DirtyDataInterceptorClient, _event: Event): boolean => {
      return controller.isDirtyContent()
    }, changeSet),
    intercept = useCallback(async (_client: DirtyDataInterceptorClient, _event: Event): Promise<boolean> => {
      clearEdit()
      return true
    }, changeSet)


  return <DirtyDataProvided
    target={wrapperRef}
    enabled={inEditMode}
    ignore={ignore}
    shouldConfirm={shouldConfirm}
    intercept={intercept}
  >
    <div
      key={id}
      id={`issue-view-content-${id}`}
      className={mergeClasses("comment", first && "first", focused && "focused")}
      ref={wrapperRef as any}
      {...extraProps}
    >
      <div className="commentInternal">
        {first && !last && <div className={mergeClasses("connection", "first")}/>}
        <div ref={containerRef} className={mergeClasses("container", first && "first", focused && "focused")}>
          <div className={mergeClasses("content")}>
            <div className="top">
              <div className="text">
                <Avatar user={user} text picture={false}/> -
                {newComment ?
                  "new comment" :
                  <>created at {uiGithubDate(created_at || updated_at)}</>
                }
              </div>
              {!inEditMode && canEdit && <div className="editButton" onClick={onEditClick}>
                <Octicon icon={Octicons.Pencil}/>
              </div>}
            </div>
            <div className={mergeClasses("bottom", inEditMode && "edit")}>
              <div className={mergeClasses("text", inEditMode && "edit")}>
                {inEditMode ?

                  <EditBody
                    type={newComment ? "newComment" : comment ? "comment" : "issue"}
                    issue={issue}
                    objectId={newComment ? -1 : comment ? comment.id : issue.id}
                    object={comment || issue}
                    onSave={onSave}
                    onCancel={onCancel}
                    onDirty={onDirty}
                  />

                  :
                  <>
                    <MarkdownView
                      classes={{
                        root: classes.markdown
                      }}
                      source={_.isEmpty(body && body.trim()) ? "No content provided" : body}
                    />
                  </>
                }

              </div>
            </div>
          </div>
        </div>
        <div className={mergeClasses("creator", first && "first", focused && "focused")}>
          <Avatar square user={getValue(() => user)} className={mergeClasses("avatar", focused && "focused")}/>
        </div>
        {!last && <div className={mergeClasses("connection")}/>}
      </div>
    </div>
  </DirtyDataProvided>
})

Object.assign(IssueTimelineEventComponents, {
  comment: IssueContentBody,
  activity: IssueActivity
})




