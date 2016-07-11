
import {Map,List} from 'immutable'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createSelector} from 'reselect'
import {DataState} from 'shared/actions/data/DataState'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {DataKey} from 'shared/Constants'
import {Repo} from 'shared/models/Repo'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {Issue} from 'shared/models/Issue'

const availReposSelector = (state):Map<string,AvailableRepo> => state.get(DataKey).models.get(AvailableRepo.$$clazz)
const reposSelector = (state):Map<string,Repo> => state.get(DataKey).models.get(Repo.$$clazz)
const milestonesSelector = (state):Map<string,Milestone> => state.get(DataKey).models.get(Milestone.$$clazz)
const labelsSelector = (state):Map<string,Label> => state.get(DataKey).models.get(Label.$$clazz)
const issuesSelector = (state):Map<string,Issue> => state.get(DataKey).models.get(Issue.$$clazz)


const dataModelsSelector = (state,type) => state.get(DataKey)
	.models
	.get(AvailableRepo.$$clazz) || Map<string,any>()

export const enabledRepoSelector = (state):AvailableRepo[] => dataModelsSelector(
		state,
		AvailableRepo.$$clazz
	)
	.valueSeq()
	.filter(availRepo => availRepo.enabled)
	.toArray()

export const enabledRepoIdSelector = (state):number[] => enabledRepoSelector(state)
	.map((availRepo:AvailableRepo) => availRepo.repoId)

export function createEnabledAvailRepoSelector() {
	return createDeepEqualSelector(
		enabledRepoSelector,
		(availRepos:AvailableRepo[]) => availRepos
	)
}

export function createIssuesSelector() {
	return createSelector(
		enabledRepoIdSelector,
		issuesSelector,
		(repoIds:number[],issueMap:Map<string,Issue>) => {
			if (!issueMap)
				return []

			const issues = issueMap.valueSeq()

			return repoIds.map(repoId => issues.filter(issue => issue.repoId === repoId))
				.reduce((allIssues,nextIssues) => {
					return allIssues.concat(nextIssues)
				},List<Issue>()).toArray()
		}
	)
}

export function createAvailableRepoCountSelector() {
	return createSelector(
		availReposSelector,
		(availRepoMap:Map<string,AvailableRepo>) => availRepoMap.size
	)
}

/**
 * Create a search results selector
 */
export function createAvailableRepoSelector() {
	return createSelector(
		availReposSelector,
		reposSelector,
		milestonesSelector,
		labelsSelector,

		// Computed value, array of SearchResult
		(
			availRepoMap:Map<string,AvailableRepo>,
			repoMap:Map<string,Repo>,
		    milestoneMap:Map<string,Milestone>,
			labelMap:Map<string,Label>
		) => {

			return availRepoMap.toArray().map(stateAvailRepo => {
				const availRepo = new AvailableRepo(stateAvailRepo)
				const
					repo = repoMap.find(item => item.id === availRepo.repoId),
					labels = labelMap
						.valueSeq()
						.filter(label => label.repoId === repo.id)
						.toArray(),
					milestones = milestoneMap
						.valueSeq()
						.filter(milestone => milestone.repoId === repo.id)
						.toArray()

				Object.assign(availRepo,{repo,labels,milestones})

				return availRepo
			})


		}
	)


}
