

import {Repo} from 'shared/models/Repo'
import {Issue} from 'shared/models/Issue'
import {Comment} from 'shared/models/Comment'
import {Settings} from 'shared/Settings'

export function canCreateIssue(repo:Repo) {
	return repo && repo.permissions && repo.permissions.pull
}

export function canAssignIssue(repo:Repo) {
	return repo && repo.permissions && repo.permissions.push
}

export function canEditIssue(repo:Repo,issue:Issue) {
	return (canAssignIssue(repo) || issue.user.id === Settings.user.id)
}

export function canEditComment(repo:Repo,comment:Comment) {
	return (canAssignIssue(repo) || comment.user.id === Settings.user.id)
}