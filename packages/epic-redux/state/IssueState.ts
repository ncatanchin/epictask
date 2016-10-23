

import {List,Map,Record} from 'immutable'
import {RegisterModel} from 'shared/Registry'

import {ActionMessage} from 'typedux'
import { Comment, Issue, IssuesEvent } from 'shared/models'
import { IIssueFilter, EmptyIssueFilter } from 'shared/actions/issue/IIssueFilter'
import {IIssueSort} from 'shared/actions/issue/IIssueSort'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {TIssueEditInlineConfig} from './IIssueListItems'
import { reviveImmutable } from "shared/util/ModelUtil"

// Refactor - so we export here too
export {TIssueEditInlineConfig} from './IIssueListItems'


const log = getLogger(__filename)

export type TIssueActivity = {
	events:List<IssuesEvent>
	comments:List<Comment>
	selectedIssue:Issue
}

export type TIssuePatchMode = "Label" | "Milestone" | "Assignee"

export interface IIssuePatchLabel {
	action:'add'|'remove'
	label:Label
}

export type TEditCommentRequest = {
	issue:Issue,
	comment:Comment
}

/**
 * Issue sort and filter type
 */
export type TIssueSortAndFilter = {issueFilter:IIssueFilter,issueSort:IIssueSort}


export const IssuePatchModes = {
	Label:Label.$$clazz,
	Milestone:Milestone.$$clazz,
	Assignee:'Assignee',
}



export const IssueStateRecord = Record({
	issues: List<Issue>(),
	comments:List<Comment>(),
	issuesEvents:List<IssuesEvent>(),
	groupVisibility:Map<string,boolean>(),
	selectedIssueIds:[],
	focusedIssueIds: [],
	
	activityLoading: false,
	
	editingInline:false,
	editInlineConfig:null,
	editingIssue:null,
	editCommentRequest:null,
	
	patchIssues:null,
	patchMode:null,
	
	issueSaveError: null,
	issueSaving: false,
	issueSort:{
		fields:['created_at'],
		direction:'desc',
		groupBy: 'none',
		groupByDirection: 'asc'
	} as IIssueSort,
	issueFilter:EmptyIssueFilter

})

/**
 * Registry state
 *
 */
@RegisterModel
export class IssueState extends IssueStateRecord {

	static fromJS(o:any) {
		return reviveImmutable(
			o,
			IssueState,
			['issues','comments','issuesEvents'],
			['groupVisibility']
		)
	}
	
	toJS() {
		return _.pick(
			this,
			'issueFilter',
			'issueSort',
			'selectedIssueIds',
			'patchIssues',
			'patchMode',
			'editingIssue',
			'editCommentRequest'
		)
	}
	
	
	
	issues:List<Issue>
	
	focusedIssueIds:number[]
	
	groupVisibility:Map<string,boolean>
	issueSort:IIssueSort
	issueFilter:IIssueFilter
	
	activityLoading: boolean
	
	issueSaving:boolean
	issueSaveError: Error
	comments:List<Comment>
	issuesEvents:List<IssuesEvent>
	editInlineConfig:TIssueEditInlineConfig
	selectedIssueIds:Array<number>
	patchIssues:Issue[]
	patchMode:TIssuePatchMode
	editCommentRequest:TEditCommentRequest
	editingIssue:Issue
	editingInline:boolean

}

/**
 * RepoMessage
 */
export interface IssueMessage extends ActionMessage<IssueState> {

}
