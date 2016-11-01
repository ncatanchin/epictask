

//import {Repo,Issue,Comment} from 'epic-models'
import {getSettings} from './settings/getSettings'
import { getValue } from  "./ObjectUtil"

const getUserId = () => getValue(() => getSettings().user.id,-2)

export function canCreateIssue(repo) {
	return repo && repo.permissions && repo.permissions.pull
}

export function canAssignIssue(repo) {
	return repo && repo.permissions && (repo.permissions.push || repo.permissions.admin)
}

export function canEditIssue(repo,issue) {
	return (canAssignIssue(repo) || getValue(() => issue.user.id,-1) === getUserId())
}

export function canEditComment(repo,comment) {
	return (canAssignIssue(repo) || comment.user.id === getUserId())
}


export function canEditRepo(repo) {
	return canAssignIssue(repo)
}

