import {cloneObject} from 'shared/util/ObjectUtil'
const log = getLogger(__filename)

import {List} from 'immutable'
import {DefaultLeafReducer} from 'typedux'
import {RepoKey} from "shared/Constants"
import {RepoState,RepoMessage} from './RepoState'

import {Repo, AvailableRepo,Comment,Issue,Label} from 'shared/models'
import {SyncStatus, ISyncDetails} from 'shared/models/Sync'

export class RepoReducer extends DefaultLeafReducer<RepoState,RepoMessage> {

	constructor() {
		super(RepoKey,RepoState)
	}


	/**
	 *
	 * @returns {RepoState}
	 */
	defaultState():any {
		return new RepoState()
	}

	/**
	 * Set user repo list
	 *
	 * @param repos
	 * @returns {RepoStateModel}
	 */
	setAvailableRepos(state:RepoState,availableRepos:AvailableRepo[]) {
		return state.merge({
			availableRepos: List(availableRepos),
			issues: state.issues.filter(
				issue => availableRepos.findIndex(
					availRepo => issue.repoId === availRepo.repoId
				) > -1
			)
		})
	}

	/**
	 * Set user repo list
	 *
	 * @param repos
	 * @returns {RepoStateModel}
	 */
	setRepos(state:RepoState,repos:Repo[]) {
		return state.set('repos',_.uniqueListBy(List(repos),'id'))
	}

	setIssues(state:RepoState,issues:Issue[]) {
		return state.set('issues',_.uniqueListBy(List<Issue>(issues),'id'))
	}

	setIssue(state:RepoState,issue:Issue) {
		return state.set('issue',issue)
	}

	setComments(state:RepoState,comments:Comment[]) {
		return state.set('comments',_.uniqueListBy(List<Comment>(comments),'id'))


	}

	setSelectedIssues(state:RepoState,selectedIssues:Issue[]) {
		// if the length is 1 or 0 then we update the base
		// selected issue id for an appropriate reset value
		const selectedIssue = (selectedIssues.length === 1) ?
			cloneObject(selectedIssues[0]) : null

		return state
			.set('selectedIssues',_.uniqueListBy(List<Issue>(selectedIssues),'id'))
			.set('selectedIssue',selectedIssue) as any


	}

	clearSelectedRepos(state:RepoState) {
		return state.set('selectedRepos',List<AvailableRepo>())
	}

	setRepoSelected(state:RepoState,selectedAvailRepo:AvailableRepo,selected:boolean) {
		return state.withMutations((temp:RepoState) => {
			let selectedRepos = temp.selectedRepos
				.filter(availRepo => availRepo.id === selectedAvailRepo.id) as any

			if (selected)
				selectedRepos = selectedRepos.push(selectedAvailRepo)

			return temp.set('selectedRepos',_.uniqueListBy(selectedRepos,'id'))
		})
	}

	updateAvailableRepo(state:RepoState,updatedAvailRepo:AvailableRepo) {

		let {availableRepos} = state

		const index = availableRepos.findIndex(availRepo => availRepo.id === updatedAvailRepo.id)

		if (index === -1)
			return state

		return state.set('availableRepos',availableRepos.set(index,updatedAvailRepo))

	}



	setSyncStatus(state:RepoState,availRepo:AvailableRepo,status:SyncStatus,details:ISyncDetails) {
		log.info('Update sync status needs to be implemented ;) - probably just map to job')
		return state
	}

	setError(state:RepoState,err:Error) {
		return state.merge({error:err})
	}
}