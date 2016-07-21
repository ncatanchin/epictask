import {User} from 'shared/models/User'
const log = getLogger(__filename)

import {RegisterModel} from 'shared/Registry'
import {Map,List,Record} from 'immutable'
import {ActionMessage} from 'typedux'
import {Comment,Issue} from 'shared/models'
import {IIssueFilter} from 'shared/actions/issue/IIssueFilter'
import {IIssueSort} from 'shared/actions/issue/IIssueSort'

export * from './IIssueFilter'
export * from './IIssueSort'

export const IssueStateRecord = Record({
	issueIds:[],
	internalIssues:[],
	commentIds:[],
	selectedIssueIds:[],
	selectedIssueId:null,
	editingIssue:null,
	issueSaveError: null,
	issueSaving: false,
	issueSort:{
		fields:['updated_at'],
		direction:'desc',
		groupBy: 'none',
		groupByDirection: 'asc'
	} as IIssueSort,

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
	//internalIssues:Issue[]
	issueSort:IIssueSort
	issueFilter:IIssueFilter
	issueSaving:boolean
	issueSaveError: Error
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
