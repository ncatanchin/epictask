

import {List,Record} from 'immutable'
import {RegisterModel} from 'shared/Registry'

import {ActionMessage} from 'typedux'
import {Comment,Issue} from 'shared/models'
import {IIssueFilter} from 'shared/actions/issue/IIssueFilter'
import {IIssueSort} from 'shared/actions/issue/IIssueSort'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'


const log = getLogger(__filename)

export type TIssuePatchMode = "Label" | "Milestone" | "Assignee"

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


export type TIssueEditInlineConfig = {
	issueIndex:number,
	issue:Issue
}

export const IssueStateRecord = Record({
	issues: List<Issue>(),
	issueIndexes: List<number>(),
	comments:List<Comment>(),
	selectedIssueIds:[],
	editingInline:false,
	editInlineConfig:null,
	editingIssue:null,
	editCommentRequest:null,
	patchIssues:null,
	patchMode:null,
	
	issueSaveError: null,
	issueSaving: false,
	issueSort:{
		fields:['updated_at'],
		direction:'desc',
		groupBy: 'none',
		groupByDirection: 'asc'
	} as IIssueSort,
	issueFilter:{
		offset:0,
		limit:100,
		includeClosed: false
	} as IIssueFilter

})

/**
 * Registry state
 *
 */
@RegisterModel
export class IssueState extends IssueStateRecord {

	static fromJS(o:any) {
		if (o && o instanceof IssueState)
			return o
		
		return new IssueState(o)
	}
	
	toJS() {
		return _.pick(this,'issueFilter','issueSort','selectedIssueIds')
	}
	
	
	issues:List<Issue>
	issueSort:IIssueSort
	issueFilter:IIssueFilter
	issueIndexes:List<number>
	issueSaving:boolean
	issueSaveError: Error
	comments:List<Comment>
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
