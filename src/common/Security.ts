/**
 * User has permission to edit issue
 *
 * @param issue
 * @returns {boolean}
 */
import {IIssue} from "common/models/Issue"
import {IComment} from "common/models/Comment"
import db from "renderer/db/ObjectDatabase"
import getLogger from "common/log/Logger"

const log = getLogger(__filename)

export function hasEditPermission(issueOrComment:IIssue | IComment):boolean {
  const repo = getStoreState().DataState.repos.data.find(repo => repo.url === issueOrComment.repository_url)

  if (!repo) {
    log.warn("No repo on issueOrComment",issueOrComment)
    return false
  }

  return (!issueOrComment.user || issueOrComment.user.id === getStoreState().AppState.user.id || repo.permissions.push)
}
