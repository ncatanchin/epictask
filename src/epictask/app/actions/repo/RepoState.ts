
/**
 * Repo State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

const log = getLogger(__filename)

import {Repo, AvailableRepo,Issue,SyncStatus,ISyncDetails} from 'shared/models'

@RecordModel()
class RepoStateModel {

	@RecordProperty()
	selectedRepos:AvailableRepo[]

	@RecordProperty()
	availableRepos:AvailableRepo[]

	@RecordProperty()
	issues:Issue[]

	@RecordProperty()
	selectedIssues:Issue[]

	@RecordProperty()
	selectedIssue:Issue

	@RecordProperty()
	repos:Repo[]

	@RecordProperty()
	error:Error


	/**
	 * Set user repo list
	 *
	 * @param repos
	 * @returns {RepoStateModel}
	 */
	setAvailableRepos(repos:AvailableRepo[]) {
		this.availableRepos = repos
		return this
	}

	/**
	 * Set user repo list
	 *
	 * @param repos
	 * @returns {RepoStateModel}
	 */
	setRepos(repos:Repo[]) {
		this.repos = repos
		return this
	}

	setIssues(issues:Issue[]) {
		this.issues = issues
		return this
	}

	setSelectedIssues(selectedIssues:Issue[]) {
		this.selectedIssues = selectedIssues

		// if the length is 1 or 0 then we update the base
		// selected issue id for an appropriate reset value
		if (selectedIssues.length < 2)
			this.selectedIssue = selectedIssues[0]

		return this
	}

	clearSelectedRepos() {
		this.selectedRepos = []
		return this
	}

	setRepoSelected(selectedAvailRepo:AvailableRepo,selected:boolean) {
		this.selectedRepos = (selected) ?
			_.uniq(this.selectedRepos.concat([selectedAvailRepo])) :
			this.selectedRepos.filter(availRepo => availRepo.id !== selectedAvailRepo.id)
		return this
	}

	updateAvailableRepo(updatedAvailRepo:AvailableRepo) {
		const index = this.availableRepos.findIndex(availRepo => availRepo.id === updatedAvailRepo.id)
		this.availableRepos = Array.from(this.availableRepos)

		if (index > -1) {
			this.availableRepos[index] = updatedAvailRepo
		} else {
			this.availableRepos.push(updatedAvailRepo)
		}

		return this

	}



	setSyncStatus(availRepo:AvailableRepo,status:SyncStatus,details:ISyncDetails) {
		log.info('Update sync status needs to be implemented ;) - probably just map to job')
		return this
	}

	setError(err:Error) {
		this.error = err
		return this
	}
}



const RepoStateDefaults = {
	repos: [],
	availableRepos: [],
	selectedRepos: [],
	selectedIssues: [],
	issues: []
}

export const RepoState = makeRecord(RepoStateModel,RepoStateDefaults)
export type TRepoState = typeof RepoState