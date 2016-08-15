import {User} from 'shared/models/User'
const log = getLogger(__filename)

import {RegisterModel} from 'shared/Registry'
import {Record} from 'immutable'
import {ActionMessage} from 'typedux'
import {Comment,Issue} from 'shared/models'
import {IIssueFilter} from 'shared/actions/issue/IIssueFilter'
import {IIssueSort} from 'shared/actions/issue/IIssueSort'
import {Label} from 'models/Label'
import {Milestone} from 'models/Milestone'

export * from './IIssueFilter'
export * from './IIssueSort'

export type TIssuePatchMode = "Label" | "Milestone" | "Assignee"

export const IssuePatchModes = {
	Label:Label.$$clazz,
	Milestone:Milestone.$$clazz,
	Assignee:'Assignee',
}


export type TIssueEditInlineConfig = {
	groupIndex:number,
	issueIndex:number,
	issue:Issue
}

export const IssueStateRecord = Record({
	issueIds:[],
	internalIssues:[],
	commentIds:[],
	selectedIssueIds:[],
	selectedIssueId:null,
	editingInline:false,
	editInlineConfig:null,
	editingIssue:null,
	editingComment:null,
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
		return new IssueState(o)
		// return new IssueState(Object.assign({},o,{
		// 	internalIssues: List(o.issues)
		// }))
	}
	//internalIssues:Issue[]
	issueSort:IIssueSort
	issueFilter:IIssueFilter
	issueSaving:boolean
	issueSaveError: Error
	editInlineConfig:TIssueEditInlineConfig
	selectedIssueId:number
	selectedIssueIds:Array<number>
	issueIds:number[]
	commentIds:string[]
	patchIssues:Issue[]
	patchMode:TIssuePatchMode
	editingComment:Comment
	editingIssue:Issue
	editingInline:boolean

}

/**
 * RepoMessage
 */
export interface IssueMessage extends ActionMessage<IssueState> {

}
