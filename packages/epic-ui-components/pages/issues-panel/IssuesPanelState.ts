import { DefaultIssueSort } from "epic-typedux/state/issue/IIssueSort"


import { Map,Record,List } from "immutable"
import { reviveImmutable } from "epic-global/ModelUtil"
import { RegisterModel } from "epic-global/Registry"
import { DefaultIssueFilter } from "epic-typedux/state/issue/IIssueFilter"
import { IssuesEvent,Issue,Comment } from "epic-models"
import { toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"
import { TIssueEditInlineConfig } from "epic-typedux/state/issue/IIssueListItems"
import { Label } from "epic-models/Label"
import { Milestone } from "epic-models/Milestone"




const
	log = getLogger(__filename)

export type TIssueActivity = {
	events:List<IssuesEvent>
	comments:List<Comment>
	selectedIssue:Issue
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



export const IssuesPanelStateRecord = Record({
	issues:List<Issue>(),
	
	comments:List<Comment>(),
	issuesEvents:List<IssuesEvent>(),
	
	groupVisibility:Map<string,boolean>(),
	
	selectedIssueIds:List<number>(),
	focusedIssueIds: List<number>(),
	issueSort:DefaultIssueSort,
	issueFilter:DefaultIssueFilter,
	
	activityLoading: false,
	
	editingInline:false,
	editInlineConfig:null,
	editingIssue:null,
	editCommentRequest:null,
	
	patchIssues:null,
	patchMode:null,
	
	issueSaveError: null,
	issueSaving: false,
})

@RegisterModel
class IssuesPanelState extends IssuesPanelStateRecord {
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			IssuesPanelState,
			['issueIds','commentIds','issueEventIds','selectedIssueIds','focusedIssueIds'],
			['groupVisibility']
		)
	}
	
	toJS() {
		return toPlainObject(this,excludeFilterConfig(
			...excludeFilter(
				'activityLoading',
				'issues',
				'issuesEvents',
				'comments',
				/^edit/,
				/^issueSav/
			)))
	}
	
	issues:List<Issue>
	comments:List<Comment>
	issuesEvents:List<IssuesEvent>
	
	//
	// issueIds:List<number>
	// commentIds:List<number>
	// issuesEventIds:List<number>
	//
	issueSort:IIssueSort
	issueFilter:IIssueFilter
	
	groupVisibility:Map<string,boolean>
	
	selectedIssueIds:List<number>
	focusedIssueIds:List<number>
	
	activityLoading: boolean
	
	issueSaving:boolean
	issueSaveError: Error
	
	editInlineConfig:TIssueEditInlineConfig
	patchIssues:Issue[]
	patchMode:TIssuePatchMode
	editCommentRequest:TEditCommentRequest
	editingIssue:Issue
	editingInline:boolean
	
	
	constructor(o:any = {}) {
		super(o)
	}
}


export default IssuesPanelState