

import {Repo} from 'shared/models/Repo'
import {Issue} from 'shared/models/Issue'
import {Settings} from 'shared/Settings'

export function canCreateIssue(repo:Repo) {
	return repo.permissions && repo.permissions.pull
}

export function canAssignIssue(repo:Repo) {
	return repo.permissions && repo.permissions.push
}

export function canEditIssue(repo:Repo,issue:Issue) {
	return (canAssignIssue(repo) || issue.user.id === Settings.user.id)
}