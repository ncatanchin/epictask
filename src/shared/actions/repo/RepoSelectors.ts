
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {AvailableRepo} from 'shared/models/AvailableRepo'


import {RepoState} from "shared/actions/repo/RepoState"
import {RepoKey} from "shared/Constants"
import { Milestone, Label, User } from "shared/models"

/**
 * Get the current repo state
 * @param state
 * @return {RepoState}
 */
export const repoStateSelector:(state) => RepoState = (state) => state.get(RepoKey)

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

/**
 * All enabled milestones
 */
export const enabledMilestonesSelector =
	(state):Milestone[] => _.nilFilter(repoStateSelector(state).enabledMilestones)



/**
 * All enabled milestones
 */
export const enabledLabelsSelector =
	(state):Label[] => _.nilFilter(repoStateSelector(state).enabledLabels)


/**
 * All enabled milestones
 */
export const enabledAssigneesSelector =
	(state):User[] => _.nilFilter(repoStateSelector(state).enabledAssignees)



/**
 * All available repos that have been added (excluding deleted)
 */
export const availableReposSelector =
	(state):AvailableRepo[] => _.nilFilter(repoStateSelector(state).availableRepos)


/**
 * Available repos - only ids
 */
export const availableRepoIdsSelector =
	(state):string[] => _.nilFilter(repoStateSelector(state).availableRepoIds)


/**
 * Only available repo ids
 */
export const enabledRepoIdsSelector =
	(state):number[] => repoStateSelector(state).enabledRepoIds


/**
 * Only enabled avail repos
 */
export const enabledAvailReposSelector =
	(state):AvailableRepo[] => repoStateSelector(state).availableRepos.filter(availRepo => availRepo.enabled)


/**
 * Repo Ids that are currently selected in the UI
 *
 * @param state
 */
export const selectedRepoIdsSelector = (state):number[] => (state)
	.map((availRepo:AvailableRepo) => availRepo.repoId)


/**
 * Number of available repos
 */
export const availableRepoCountSelector = createDeepEqualSelector(
	availableRepoIdsSelector,
	(availRepoIds:number[]) => availRepoIds.length
)
