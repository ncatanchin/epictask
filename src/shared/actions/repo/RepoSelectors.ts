
import {Map,List} from 'immutable'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createSelector} from 'reselect'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {Repo} from 'shared/models/Repo'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {availRepoModelsSelector, repoModelsSelector, milestoneModelsSelector, labelModelsSelector} from 'shared/actions/data/DataSelectors'
import {RepoState} from "shared/actions/repo/RepoState"
import {RepoKey} from "shared/Constants"

/**
 * Get the current repo state
 * @param state
 * @return {RepoState}
 */
export const repoStateSelector:(state) => RepoState = _.memoize((state) => state.get(RepoKey))

/**
 * Get repo id from object
 *
 * @param o
 * @returns {number}
 */
function getRepoId(o:any):number {
	return !o ? null :
		_.isNumber(o) ? o :
			(_.isNumber(o.repoId)) ? o.repoId :
				parseInt(o.repoId,10)
}
export const repoIdPredicate = (o:any) => {
	const repoId = getRepoId(o)
	assert(repoId > 0, 'Must provided a repoId or object with repo id')

	return (item) => _.isNumber(item) ? item === repoId : item.repoId === repoId
}

export const availReposSelector = _.memoize(
	(state):AvailableRepo[] => availRepoModelsSelector(state)
		.valueSeq()
		.toArray()
)

export const availRepoIdsSelector = _.memoize(
	(state):number[] => availReposSelector(state)
		.map(availRepo => availRepo.repoId)
)

export const enabledReposSelector:(state) => AvailableRepo[] = createDeepEqualSelector(
	repoModelsSelector,
	(state):AvailableRepo[] => availReposSelector(state)
		.filter(availRepo => availRepo.enabled),
	(repoModels,enabledRepos):AvailableRepo[] => {
		return enabledRepos.map(availRepo => {
			return (availRepo.repo) ?
				availRepo :
				assign(_.cloneDeep(availRepo),{
					repo:repoModels.get(`${availRepo.repoId}`)
				})
		})
	}
)

/**
 * Available Repos that are enabled
 *
 * @param state
 */
export const enabledRepoIdsSelector = (state):number[] => enabledReposSelector(state)
	.map((availRepo:AvailableRepo) => availRepo.repoId)

/**
 * Repo Ids that are currently selected in the UI
 *
 * @param state
 */
export const selectedRepoIdsSelector = (state):number[] => (state)
	.map((availRepo:AvailableRepo) => availRepo.repoId)

export function createEnabledAvailRepoSelector() {
	return createDeepEqualSelector(
		enabledReposSelector,
		(availRepos:AvailableRepo[]) => availRepos
	)
}

export const availableRepoCountSelector = createDeepEqualSelector(
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
