
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
import {availRepoModelsSelector, repoModelsSelector, milestoneModelsSelector, labelModelsSelector} from 'shared/actions/data/DataSelectors'

export const availReposSelector = _.memoize(
	(state):AvailableRepo[] => availRepoModelsSelector(state)
		.valueSeq()
		.toArray()
)

export const availRepoIdsSelector = _.memoize(
	(state):number[] => availReposSelector(state)
		.map(availRepo => availRepo.repoId)
)

export const enabledReposSelector = (state):AvailableRepo[] => availReposSelector(state)
	.filter(availRepo => availRepo.enabled)


export const enabledRepoIdsSelector = (state):number[] => enabledReposSelector(state)
	.map((availRepo:AvailableRepo) => availRepo.repoId)

export function createEnabledAvailRepoSelector() {
	return createDeepEqualSelector(
		enabledReposSelector,
		(availRepos:AvailableRepo[]) => availRepos
	)
}

export const availableRepoCountSelector = createSelector(
	availRepoModelsSelector,
	(availRepoMap:Map<string,AvailableRepo>) => availRepoMap.size
)

/**
 * Create a search results selector
 */
export function createAvailableRepoSelector() {
	return createSelector(
		availRepoModelsSelector,
		repoModelsSelector,
		milestoneModelsSelector,
		labelModelsSelector,

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
