


/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {ActionFactory,Action} from 'typedux'
import {RepoKey} from "epictask/shared/Constants"
import {RepoMessage,RepoState,ISyncDetails,SyncStatus} from './index'
import {Repo, RepoRepo,AvailableRepo,AvailableRepoRepo,github} from 'epictask/shared'
import {getRepo} from 'epictask/shared/DBService'
import {JobActionFactory,AppActionFactory,JobHandler} from 'app/actions'

const JobActions = new JobActionFactory()
const AppActions = new AppActionFactory()
/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/

 export class RepoActionFactory extends ActionFactory<any,RepoMessage> {

	constructor() {
		super(RepoState)
	}

	leaf():string {
		return RepoKey;
	}

	@Action()
	setRepos(repos:Repo[]) {
	}

	@Action()
	setRepo(repo:Repo) {
	}

	@Action()
	setAvailableRepos(repos:AvailableRepo[]) {
	}

	/**
	 * Persis repos to database
	 *
	 * @param newRepos
	 */
	private async persistRepos(newRepos:Repo[]):Promise<number> {
		const repoRepo =  getRepo(RepoRepo)

		log.debug(`Persisting ${newRepos.length} repos`)
		const beforeCount = await repoRepo.count()
		await repoRepo.bulkSave(...newRepos)
		const afterCount = await repoRepo.count()

		log.debug(`After persistence there are ${afterCount} repos in the system, new count = ${afterCount - beforeCount}`)

		return afterCount - beforeCount
	}

	@Action()
	syncRepos() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			const client = github.createClient()

			try {

				let repos = await client.userRepos({traversePages:true})
				log.debug(`Received repos`,repos,'persisting now')

				const newRepoCount = await actions.persistRepos(repos)
				log.debug('New repos',newRepoCount)
				actions.setRepos(repos)
			} catch (err) {
				log.error('Failed to get repos',err,err.stack)
				actions.setError(err)
				throw err
			}
		}
	}

	@Action()
	setSyncStatus(availRepo:AvailableRepo,status:SyncStatus,details:ISyncDetails) {}

	@Action()
	syncIssues(availRepo:AvailableRepo) {
		return async(dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const jobActions = JobActions.withDispatcher(dispatch,getState)
			const appActions = AppActions.withDispatcher(dispatch,getState)

			try {
				actions.setSyncStatus(availRepo,SyncStatus.InProgress,{progress: 0})

				await jobActions.processJob((handler:JobHandler) => {
					// TODO: Do actual sync here
				})

				actions.setSyncStatus(availRepo,SyncStatus.Completed,{progress: 100})
			} catch (err) {
				log.error('failed to sync repo issues',err)
				appActions.addErrorMessage(err)
				actions.setSyncStatus(availRepo,SyncStatus.Failed,{error:err})
			}
		}
	}

	/**
	 * Starts a synchronization for all repos that
	 * have been marked as available by the user
	 *
	 * _note_: this includes repos that are not enabled
	 */
	@Action()
	syncAllIssues() {
		return async(dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			log.debug('Getting avail repos from DB, not state')
			const availRepos = await actions.getAvailableRepos()
			availRepos.forEach(availRepo => {
				actions.syncIssues(availRepo)
			})
		}
	}


	@Action()
	getAvailableRepos():Promise<AvailableRepo[]> {
		return (async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const availRepos = await getRepo(AvailableRepoRepo).findAll()

			const repoRepo = getRepo(RepoRepo)

			availRepos.forEach(async (availRepo) => {
				const repoState = actions.state
				availRepo.repo = availRepo.repo ||
					repoState.repos.find(repo => repo.id === availRepo.repoId)

				if (availRepo.repo)
					return

				availRepo.repo = await repoRepo.get(repoRepo.key(availRepo.repoId))

			})

			log.debug('Loaded available repos',availRepos)
			actions.setAvailableRepos(availRepos)

			return availRepos
		}) as any
	}

	@Action()
	getRepos() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const repos = await getRepo(RepoRepo).findAll()
			log.debug('Loaded all repos',repos)
			actions.setRepos(repos)
		}
	}

	@Action()
	clearSelectedRepos() { }

	@Action()
	updateAvailableRepo(availRepo:AvailableRepo) {}

	@Action()
	setRepoSelected(selectedAvailableRepo:AvailableRepo,selected:boolean) { }

	@Action()
	setRepoEnabled(availRepo:AvailableRepo,enabled:boolean) {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			if (enabled === availRepo.enabled)
				return

			const availRepoRepo = getRepo(AvailableRepoRepo)

			const newAvailRepo = new AvailableRepo(availRepoRepo.mapper.toObject(availRepo))
			newAvailRepo.enabled = enabled


			await availRepoRepo.save(newAvailRepo)
			actions.updateAvailableRepo(newAvailRepo)

			log.info('Saved avail repo, setting enabled to',enabled,newAvailRepo)

			return true
		}
	}

}