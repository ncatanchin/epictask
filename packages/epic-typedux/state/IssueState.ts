import { List, Map, Record } from "immutable"
import { RegisterModel } from "epic-global"
import { ActionMessage } from "typedux"
import { Comment, Issue, IssuesEvent, Label, Milestone } from "epic-models"
import { TIssueEditInlineConfig, IIssueSort, IIssueFilter, EmptyIssueFilter } from "./issue"
import { reviveImmutable } from "epic-global"
import { toPlainObject } from "typetransform"
import { excludeFilterConfig, excludeFilter } from "typetransform/dist/Helpers"

// Refactor - so we export here too
// export {
// 	TIssueEditInlineConfig
// }


const
	log = getLogger(__filename)

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
		return toPlainObject(this,excludeFilterConfig(
		...excludeFilter(
			'activityLoading',
			/^edit/,
			/^issueSav/
		)))
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
