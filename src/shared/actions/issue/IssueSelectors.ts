
import {Map,List} from 'immutable'
import {createSelector} from 'reselect'

import {IssueKey} from 'shared/Constants'
import {Issue} from 'shared/models/Issue'
import {
	issueModelsSelector, createModelsSelector, commentModelsSelector
} from 'shared/actions/data/DataSelectors'
import {IssueState} from 'shared/actions/issue/IssueState'
import {Comment} from 'shared/models/Comment'


export const issueIdsSelector = _.memoize((state):number[] =>(state.get(IssueKey) as IssueState).issueIds)


/**
 * Global selector for selectedIssues changed
 *
 * @type {Reselect.Selector<Map<string, any>, number[]>|Reselect.Selector<TInput, TOutput>}
 */
export const selectedIssueIdsSelector = createSelector(
	(state:Map<string,any>) => (state.get(IssueKey) as IssueState).selectedIssueIds,
	(selectedIssueIds:number[]) => selectedIssueIds
)


export const issuesSelector = createSelector(
	issueIdsSelector,
	issueModelsSelector,
	(issueIds:number[],issueMap:Map<string,Issue>) => {

		// If data not avail then return empty
		if (!issueMap || !issueIds)
			return []

		return issueIds.map(issueId => issueMap.get(`${issueId}`))
	}
)



/**
 * Selector for all current issues that are 'selected' or 'highlighted'
 *
 * @type {Reselect.Selector<TInput, number[]>|Reselect.Selector<Map<any, any>, Issue[]>|Reselect.Selector<Map<any, any>, TOutput>}
 */
export const issuesDetailSelector = createSelector(
	createModelsSelector(),
	(state:Map<any,any>):number[] => (state.get(IssueKey) as IssueState).selectedIssueIds,
	(models,selectedIssueIds:number[]) => {
		const {repoModels,labelModels,milestoneModels,issueModels} = models

		const issues = selectedIssueIds
			.map(issueId => issueModels.get(`${issueId}`))
			.filter(issue => !_.isNil(issue))
			.map(issue => new Issue(Object.assign({},issue,{
				repo: repoModels.get(`${issue.repoId}`),
				labels: (!issue.labels) ? [] : issue.labels.map(label => labelModels.get(label.url)),
				milestone: (!issue.milestone) ? null : milestoneModels.get(`${issue.milestone.id}`)
			})))

		return issues
	}
)

export const issueSelector = _.memoize((state):Issue => {
	const issues = issuesDetailSelector(state)
	return issues && issues.length === 1 ? issues[0] : null
})


export const commentIdsSelector = _.memoize((state):string[] => (state.get(IssueKey) as IssueState).commentIds)

export const commentsSelector = createSelector(
	issueSelector,
	commentIdsSelector,
	commentModelsSelector,
	(issue:Issue,commentIds:string[],commentModels:Map<string,Comment>) => {
		return commentIds
			.map(commentId => commentModels.get(commentId))
			.filter(comment => !_.isNil(comment) && comment.issueNumber === issue.number)
	},

)

export const createCommentSelector = () => (state,props):Comment => (props.commentId) ?
	commentModelsSelector(state).get(props.commentId) :
	(props.commentIndex && props.commentIndex > -1) ?
		commentsSelector(state)[props.commentIndex] :
		null

