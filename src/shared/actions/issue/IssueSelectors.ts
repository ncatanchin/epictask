
import {Map,List} from 'immutable'
import {createSelector} from 'reselect'

import {IssueKey} from 'shared/Constants'
import {Issue} from 'shared/models/Issue'
import {
	issueModelsSelector, modelsSelector, commentModelsSelector, milestoneModelsSelector, labelModelsSelector
} from 'shared/actions/data/DataSelectors'
import {IssueState} from 'shared/actions/issue/IssueState'
import {Comment} from 'shared/models/Comment'
import {enabledRepoIdsSelector} from 'shared/actions/repo/RepoSelectors'
import {IIssueFilter,IIssueSort} from 'shared/actions/issue/IssueState'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {Milestone} from 'shared/models/Milestone'
import {Label} from 'shared/models/Label'


export const issueIdsSelector = (state):number[] =>(state.get(IssueKey) as IssueState).issueIds


/**
 * Global selector for selectedIssues changed
 *
 * @type {Reselect.Selector<Map<string, any>, number[]>|Reselect.Selector<TInput, TOutput>}
 */
export const selectedIssueIdsSelector = createDeepEqualSelector(
	(state:Map<string,any>) => (state.get(IssueKey) as IssueState).selectedIssueIds,
	(selectedIssueIds:number[]) => selectedIssueIds
)


export type TIssueSortAndFilter = {issueFilter:IIssueFilter,issueSort:IIssueSort}

export const issueSortAndFilterSelector:(state) => TIssueSortAndFilter = _.memoize((state):{issueSort:IIssueSort,issueFilter:IIssueFilter} => {
	const issueState = state.get(IssueKey) as IssueState
	return _.pick(issueState,'issueFilter','issueSort') as any
}) as any

/**
 * Milestones for enabled repos
 */
export const milestonesSelector = createDeepEqualSelector(
	enabledRepoIdsSelector,
	milestoneModelsSelector,
	(repoIds:number[],models:Map<string,Milestone>):Milestone[] => {
		return models.valueSeq()
			.filter(item => repoIds.includes(item.repoId))
			.toArray()
	}
)

/**
 * Labels for enabled repos
 */
export const labelsSelector = createDeepEqualSelector(
	enabledRepoIdsSelector,
	labelModelsSelector,
	(repoIds:number[],models:Map<string,Label>):Label[] => {

		return models.valueSeq()
			.filter(item => repoIds.includes(item.repoId))
			.toArray()
	}
)

export const issueFilterLabelsSelector = createDeepEqualSelector(
	issueSortAndFilterSelector,
	labelModelsSelector,
	(issueSortAndFilter:TIssueSortAndFilter,models:Map<string,Label>) => {
		const
			{issueFilter} = issueSortAndFilter,
			labelUrls = issueFilter.labelUrls || []

		return labelUrls.map(url => models.get(url))
	}
)

export const issueFilterMilestonesSelector = createDeepEqualSelector(
	issueSortAndFilterSelector,
	milestoneModelsSelector,
	(issueSortAndFilter:TIssueSortAndFilter,models:Map<string,Milestone>) => {
		const
			{issueFilter} = issueSortAndFilter,
			milestoneIds = issueFilter.milestoneIds || []

		return milestoneIds.map(id => models.get(`${id}`))
	}
)

export const issuesSelector = createDeepEqualSelector(
	enabledRepoIdsSelector,
	issueIdsSelector,
	issueModelsSelector,
	issueSortAndFilterSelector,
	(repoIds,issueIds:number[],issueMap:Map<string,Issue>,{issueSort,issueFilter}) => {

		// If data not avail then return empty
		if (!issueMap || !issueIds || !repoIds)
			return []

		const issues:Issue[] =
			issueIds.map(id => issueMap.get(`${id}`))
			.filter(issue => !_.isNil(issue) && repoIds.includes(issue.repoId))

		let {text,issueId,milestoneIds,labelUrls,assigneeIds} = issueFilter,
			{fields:sortFields,direction:sortDirection} = issueSort

		milestoneIds = _.nilFilter(milestoneIds || [])
		labelUrls = _.nilFilter(labelUrls || [])
		assigneeIds = _.nilFilter(assigneeIds || [])

		let filteredIssues = issues
			.filter(issue => {
				if (issueId)
					return `${issue.id}` === `${issueId}`

				let matches = repoIds.includes(issue.repoId)
				if (matches && milestoneIds.length)
					matches = issue.milestone && milestoneIds.includes(issue.milestone.id)

				if (matches && labelUrls.length)
					matches = issue.labels && labelUrls.some(url => issue.labels.findIndex(label => label.url === url) > -1)

				if (matches && assigneeIds.length)
					matches = issue.assignee && assigneeIds.includes(issue.assignee.id)

				if (matches && text)
					matches = _.toLower(issue.title + issue.body + _.get(issue.assignee,'login')).indexOf(_.toLower(text)) > -1

				return matches
			})

		filteredIssues = _.sortBy(filteredIssues,sortFields[0])

		if (sortDirection === 'desc')
			filteredIssues = filteredIssues.reverse()

		return filteredIssues
	}
)



/**
 * Selector for all current issues that are 'selected' or 'highlighted'
 *
 * @type {Reselect.Selector<TInput, number[]>|Reselect.Selector<Map<any, any>, Issue[]>|Reselect.Selector<Map<any, any>, TOutput>}
 */
export const issuesDetailSelector = createDeepEqualSelector(
	enabledRepoIdsSelector,
	issuesSelector,
	modelsSelector,
	selectedIssueIdsSelector,
	(enabledRepoIds:number[],issues,models,selectedIssueIds:number[]) => {
		const {repoModels,labelModels,milestoneModels,issueModels} = models

		issues = selectedIssueIds
			.map(issueId => issueModels.get(`${issueId}`))
			.filter(issue => !_.isNil(issue) && enabledRepoIds.includes(issue.repoId))
			.map(issue => new Issue(Object.assign({},issue,{
				repo: repoModels.get(`${issue.repoId}`),
				labels: (!issue.labels) ? [] : issue.labels.map(label => labelModels.get(label.url)),
				milestone: (!issue.milestone) ? null : milestoneModels.get(`${issue.milestone.id}`)
			})))

		return issues
	}
)

export const editingIssueSelector = _.memoize((state):Issue => (state.get(IssueKey) as IssueState).editingIssue)
export const issueSelector = _.memoize((state):Issue => {
	const issues = issuesDetailSelector(state)
	const enabledRepoIds = enabledRepoIdsSelector(state)
	const issue = issues && issues.length === 1 ? issues[0] : null
	return (issue && enabledRepoIds.includes(issue.repoId)) ? issue : null
})


export const commentIdsSelector = _.memoize((state):string[] => (state.get(IssueKey) as IssueState).commentIds)

export const commentsSelector = createDeepEqualSelector(
	issueSelector,
	commentIdsSelector,
	commentModelsSelector,
	(issue:Issue,commentIds:string[],commentModels:Map<string,Comment>) => {
		return (!issue) ? [] : commentIds
			.map(commentId => commentModels.get(commentId))
			.filter(comment => !_.isNil(comment) && comment.issueNumber === issue.number)
	},

)

export const createCommentSelector = () => (state,props):Comment => (props.commentId) ?
	commentModelsSelector(state).get(props.commentId) :
	(props.commentIndex && props.commentIndex > -1) ?
		commentsSelector(state)[props.commentIndex] :
		null

