
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {AvailableRepo} from 'shared/models/AvailableRepo'


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

export const availableRepoIdsSelector = _.memoize(
	(state):string[] => repoStateSelector(state).availableRepoIds
)

export const enabledRepoIdsSelector = _.memoize(
	(state):number[] => repoStateSelector(state).enabledRepoIds
)


/**
 * Repo Ids that are currently selected in the UI
 *
 * @param state
 */
export const selectedRepoIdsSelector = (state):number[] => (state)
	.map((availRepo:AvailableRepo) => availRepo.repoId)


export const availableRepoCountSelector = createDeepEqualSelector(
	availableRepoIdsSelector,
	(availRepoIds:number[]) => availRepoIds.length
)
