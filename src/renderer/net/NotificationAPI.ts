import {formatHeaderTimestamp, formatTimestamp, getAPI} from "renderer/net/GithubAPI"
import {ActivityListNotificationsResponseItem} from "@octokit/rest"
import getLogger from "common/log/Logger"
import {INotification, NotificationReason, NotificationType} from "common/models/Notification"
import {getValue} from "typeguard"
import {IconType, IIcon} from "common/models/Icon"
import * as moment from "moment"
import db from "renderer/db/ObjectDatabase"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import delay from "common/util/Delay"

const log = getLogger(__filename)


export async function getNotifications(since:number):Promise<Array<INotification<NotificationType.Github>>> {
  const
    gh = getAPI(),
    headerSince = formatHeaderTimestamp(since),
    params = {
      all: true,
      since: formatTimestamp(since)
    },
    issueOpts = (gh.activity.listNotifications as any).endpoint.merge({
      ...params
    }),
    notifications = Array<INotification<NotificationType.Github>>()

  for await (const response of ((gh as any).paginate.iterator(issueOpts))) {
    notifications.push(...response.data.map((activity:ActivityListNotificationsResponseItem) => {
      const
        reason = activity.reason,
        subject = getValue(() => activity.subject,null),
        repo = getValue(() => activity.repository,null),
        {full_name:repo_full_name,id:repo_id} = getValue(() => repo,{} as any),
        icon:IIcon<IconType.Octicon> = {
          type: IconType.Octicon,
          key: "Repo"
        }

      // let title:string = getValue(() => repo_full_name,"")
      // let body:string = getValue(() => subject.title,"")
      //
      // switch (reason) {
      //   case NotificationReason.assign:
      //     title = `You were assigned to an issue in ${repo_full_name}`
      // }
      //

      return {
        id: `github-${activity.id}`,
        type: NotificationType.Github,
        reason: activity.reason as any,
        icon,
        repo_full_name,
        repo_id,
        read: !activity.unread,
        payload: activity,
        updated_at: moment(activity.updated_at).valueOf()
      }}))
  }

  return notifications
}


export async function selectNotification(notification:INotification):Promise<void> {
  const
    {payload,repo_id} = notification,
    repo = repo_id ? (await db.repos.get(repo_id)) : null,
    url = getValue(() => (payload as any).subject.url,null),
    issue = url ? (await db.issues.where("url").equals(url).toArray())[0] : null

  log.info("Selected notification",notification,"on issue", issue, "url",url)
  if (issue) {
    const appActions = new AppActionFactory()
    appActions.setSelectedRepo(repo)
    await delay(100)
    appActions.setSelectedIssueIds([issue.id])
  } else {
    log.warn("Can not handle notification", notification)
  }
}
