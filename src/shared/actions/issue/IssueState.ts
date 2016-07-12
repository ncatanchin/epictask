import {User} from 'shared/models/User'
const log = getLogger(__filename)

import {RegisterModel} from 'shared/Registry'
import {Map,List,Record} from 'immutable'
import {ActionMessage} from 'typedux'
import {Comment,Issue} from 'shared/models'

export type TIssueFieldsSortable = 'updated_at'|'created_at'|'repoId'|'title'|'assignee'

export interface IIssueSort {
	// fields to sort by
	fields:TIssueFieldsSortable[]

	// Label Urls
	direction:'asc'|'desc'
}

export interface IIssueFilter {
	// Milestone Ids
	milestoneIds?:number[]

	// Label Urls
	labelUrls?:string[]

	// User ids
	assigneeIds?:number[]

	// Specific issue id
	issueId?:number

	text?:string

	offset:number

	limit:number
}

export const IssueStateRecord = Record({
	issueIds:[],
	internalIssues:[],
	commentIds:[],
	selectedIssueIds:[],
	selectedIssueId:null,
	editingIssue:null,
	issueSort:{fields:['updated_at'],direction:'desc'},
	issueFilter:{offset:0,limit:100} as IIssueFilter

})

/**
 * Registry state
 *
 */
@RegisterModel
export class IssueState extends IssueStateRecord {

	static fromJS(o:any) {
		return new IssueState(o)
		// return new IssueState(Object.assign({},o,{
		// 	internalIssues: List(o.issues)
		// }))
	}
	internalIssues:Issue[]
	issueSort:IIssueSort
	issueFilter:IIssueFilter
	selectedIssueId:number
	selectedIssueIds:Array<number>
	issueIds:number[]
	commentIds:string[]
	editingIssue:Issue

}

/**
 * RepoMessage
 */
export interface IssueMessage extends ActionMessage<IssueState> {

}
