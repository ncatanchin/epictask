

import {Repo} from 'shared/models/Repo'
import {Issue} from 'shared/models/Issue'
import {Comment} from 'shared/models/Comment'
import {getSettings} from 'shared/settings/Settings'
import { getValue } from "shared/util"

const getUserId = () => getValue(() => getSettings().user.id,-2)

export function canCreateIssue(repo:Repo) {
	return repo && repo.permissions && repo.permissions.pull
}

export function canAssignIssue(repo:Repo) {
	return repo && repo.permissions && repo.permissions.push
}

export function canEditIssue(repo:Repo,issue:Issue) {
	return (canAssignIssue(repo) || getValue(() => issue.user.id,-1) === getUserId())
}

export function canEditComment(repo:Repo,comment:Comment) {
	return (canAssignIssue(repo) || comment.user.id === getUserId())
}