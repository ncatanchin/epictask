

import {AvailableRepoRepo, AvailableRepo} from '../../../shared/GitHubModels'
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {ActionFactory,Action} from 'typedux'
import {RepoKey} from "epictask/shared/Constants"
import {RepoMessage,RepoState} from './index'
import {Repo, RepoRepo,github} from 'epictask/shared'
import {getRepo} from 'epictask/shared/DBService'

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
	getAvailableRepos() {
		return async (dispatch,getState) => {
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
		}
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
	setRepoSelected(selectedAvailRepo:AvailableRepo,selected:boolean) { }

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