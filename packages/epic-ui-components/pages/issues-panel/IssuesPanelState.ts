import { Map, Record, List } from "immutable"
import { reviveImmutable, RegisterModel } from "epic-global"
import {
	DefaultIssueSort,
	IIssueEditInlineConfig,
	DefaultIssueFilter,
	IssuesEvent,
	Issue,
	Comment,
	Label,
	Milestone
} from "epic-models"
import { toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"


/**
 * Declare the interface first
 */
declare global {
	// Expose interface
	interface IIssuesPanelState  {
		issues?:List<Issue>
		comments?:List<Comment>
		issuesEvents?:List<IssuesEvent>
		
		issueSort?:IIssueSort
		issueFilter?:IIssueFilter
		
		groupVisibility?:Map<string,boolean>
		
		selectedIssueIds?:List<number>
		focusedIssueIds?:List<number>
		
		issueSaving?:boolean
		issueSaveError?: Error
		
		editInlineConfig?:IIssueEditInlineConfig
		editingIssue?:Issue
		
	}
}



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
	
	editInlineConfig:null,
	editingIssue:null,
	
	issueSaveError: null,
	issueSaving: false,
} as IIssuesPanelState)

@RegisterModel
export class IssuesPanelState extends IssuesPanelStateRecord implements IssuesPanelState {
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			IssuesPanelState,
			['issues','comments','issuesEvents','selectedIssueIds','focusedIssueIds'],
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
	
	issueSort:IIssueSort
	issueFilter:IIssueFilter
	
	groupVisibility:Map<string,boolean>
	
	selectedIssueIds:List<number>
	focusedIssueIds:List<number>
	
	issueSaving:boolean
	issueSaveError: Error
	
	editInlineConfig:IIssueEditInlineConfig
	editingIssue:Issue
	
	constructor(o:any = {}) {
		super(o)
	}
}

export default IssuesPanelState