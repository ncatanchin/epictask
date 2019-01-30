import {formatHeaderTimestamp, formatTimestamp, getAPI} from "renderer/net/GithubAPI"
import {ActivityListNotificationsResponseItem} from "@octokit/rest"
import getLogger from "common/log/Logger"
import {INotification, NotificationType} from "common/models/Notification"

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
    notifications.push(...response.data.map((activity:ActivityListNotificationsResponseItem) => ({
      id: `github-${activity.id}`,
      type: NotificationType.Github,
      title: activity.subject
    })))
  }

  return notifications
}
