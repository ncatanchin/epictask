
/**
 * Repo State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {ActionMessage} from 'typedux'
const log = getLogger(__filename)

import {Repo, AvailableRepo,Comment,Issue,Label,Milestone,SyncStatus,ISyncDetails} from 'shared/models'
import {cloneObject} from 'shared/util/ObjectUtil'

@RecordModel()
class RepoStateModel {

	@RecordProperty()
	selectedRepos:AvailableRepo[]

	@RecordProperty()
	availableRepos:AvailableRepo[]

	@RecordProperty()
	issues:Issue[]

	@RecordProperty()
	issue:Issue

	@RecordProperty()
	comments:Comment[]

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
		this.availableRepos = cloneObject(repos)
		return this
	}

	/**
	 * Set user repo list
	 *
	 * @param repos
	 * @returns {RepoStateModel}
	 */
	setRepos(repos:Repo[]) {
		this.repos = cloneObject(repos)
		return this
	}

	setIssues(issues:Issue[]) {
		this.issues = cloneObject(issues)
		return this
	}

	setIssue(issue:Issue) {
		this.issue = cloneObject(issue)
		return this
	}

	setComments(comments:Comment[]) {
		this.comments = cloneObject(comments)
		return this
	}

	setSelectedIssues(selectedIssues:Issue[]) {
		this.selectedIssues = cloneObject(selectedIssues)

		// if the length is 1 or 0 then we update the base
		// selected issue id for an appropriate reset value
		if (selectedIssues.length < 2)
			this.selectedIssue = cloneObject(selectedIssues[0])

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
		if (index === -1)
			return this

		const newAvailRepos = cloneObject(this.availableRepos)
		newAvailRepos.splice(index,1,cloneObject(updatedAvailRepo))
		this.availableRepos = newAvailRepos

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


export interface RepoMessage extends ActionMessage<typeof RepoState> {

}
