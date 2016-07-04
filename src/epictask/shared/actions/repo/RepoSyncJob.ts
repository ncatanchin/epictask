import {Container,AutoWired,Inject} from 'typescript-ioc'
import {IJobRequest} from 'shared/actions/jobs/JobState'
import {JobHandler} from 'shared/actions/jobs/JobHandler'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import ActivityManagerService from 'main/services/ActivityManagerService'

import * as moment from 'moment'

import {GitHubClient} from 'shared/GitHubClient'
import {SyncStatus,User,Repo,AvailableRepo,Comment,ActivityType,github} from 'shared'
import {Stores} from 'main/services/DBService'
import {Settings} from 'shared/Settings'
import Toaster from 'shared/Toaster'

const log = getLogger(__filename)


export class RepoSyncJob implements IJobRequest {

	name:string
	client:GitHubClient
	lastSyncParams:any
	oneAtATime = true

	constructor(private availRepo:AvailableRepo) {
		this.name = `syncing ${availRepo.repo.full_name}`
		if (!Settings.token) {
			log.info("Can not sync, not authenticated")
			return
		}


	}

	/**
	 * Init params
	 *
	 * @param repo
	 */
	async initParams(activityManager,repo) {
		this.client = Container.get(GitHubClient)

		const lastActivity = await activityManager.findLastActivity(ActivityType.RepoSync,repo.id)
		const lastSyncTimestamp = new Date(lastActivity ? lastActivity.timestamp : 0)
		const lastSyncTimestamp8601 = moment(lastSyncTimestamp.getTime()).format()
		this.lastSyncParams = {since: lastSyncTimestamp8601}

		if (lastActivity) {
			log.info(`Last repo sync for ${repo.full_name} was ${moment(lastActivity.timestamp).fromNow()}`)
		}
	}


	/**
	 * Synchronize all issues
	 *
	 * @param repo
	 */
	async syncCollaborators(stores:Stores,repo:Repo) {
		const userRepo = stores.user

		const collabsPromise = (repo.permissions.push) ?
			this.client.repoCollaborators(repo) :
			this.client.repoContributors(repo)

		let collabs = await collabsPromise
		collabs = await Promise.all(collabs.map(async (user:User) => {

			const existingUser = await userRepo.findByLogin(user.login)
			if (existingUser) {
				user = new User(_.merge(user,existingUser))

			}

			user.addRepoId(repo.id)
			return user
		})) as any

		//log.debug(`Loaded collabs/users, time to persist`, collabs)
		await userRepo.bulkSave(...collabs)
	}

	/**
	 * Synchronize all issues
	 *
	 * @param repo
	 */
	async syncIssues(stores:Stores,repo) {
		const issues = await this.client.repoIssues(repo,{params:this.lastSyncParams})
		issues.forEach(issue => issue.repoId = repo.id)
		//log.debug(`Loaded issues, time to persist`, issues)
		await stores.issue.bulkSave(...issues)
	}

	/**
	 * Synchronize all labels
	 *
	 * @param repo
	 */
	async syncLabels(stores,repo) {
		const labels = await this.client.repoLabels(repo)
		labels.forEach(label => label.repoId = repo.id)
		//log.debug(`Loaded labels, time to persist`, labels)
		await stores.label.bulkSave(...labels)
	}

	/**
	 * Synchronize all milestones in the repository
	 *
	 * @param repo
	 */
	async syncMilestones(stores,repo) {
		const milestones = await this.client.repoMilestones(repo)
		milestones.forEach(milestone => milestone.repoId = repo.id)
		//log.debug(`Loaded milestones, time to persist`, milestones)
		await stores.milestone.bulkSave(...milestones)
	}

	/**
	 * Synchronize all comments in the repository
	 *
	 * @param repo
	 */
	async syncComments(stores,repo) {
		let comments = await this.client.repoComments(repo,{params:this.lastSyncParams})

		// Filter JUST in case there are some missing issue urls
		//comments = comments.filter(comment => comment.issue_url)

		// Fill in the fields we tack directly
		comments.forEach(comment => {
			if (!comment.issue_url) {
				log.error(`Comment is missing issue url`, comment)
				return
			}
			comment.repoId = repo.id

			const issueIdStr = comment.issue_url.split('/').pop()
			comment.issueNumber = parseInt(issueIdStr,10)
			comment.parentRefId = Comment.makeParentRefId(repo.id,comment.issueNumber)
		})

		//log.debug(`Loaded comments, time to persist`, comments)
		await stores.comment.bulkSave(...comments)
	}

	/**
	 * Job executor
	 *
	 * @param handler
	 */
	async executor(handler:JobHandler) {
		const activityManager = Container.get(ActivityManagerService)
		const stores = Container.get(Stores)
		const toaster = Container.get(Toaster)
		const repoActions =  Container.get(RepoActionFactory)
		const appActions = Container.get(AppActionFactory)

		const {availRepo} = this



		if (!Settings.token) {
			log.info("Can not sync, not authenticated")
			return
		}

		const {job} = handler

		log.debug(`Starting repo sync job: `, job.id)
		try {

			// Grab the repo
			let {repo, repoId} = availRepo
			if (!repo) repo = await repoActions.getRepo(repoId)

			// Check the last updated activity
			await this.initParams(activityManager,repo)

			// Load the issues, eventually track progress
			log.debug('waiting for all promises')
			await Promise.all([
				this.syncIssues(stores,repo),
				this.syncLabels(stores,repo),
				this.syncMilestones(stores,repo),
				this.syncComments(stores,repo),
				this.syncCollaborators(stores,repo)
			])

			// Commit all text indexes
			// log.debug(`Updating all indexes now`)
			// await LunrIndex.persistAll()
			// log.debug('Persisted all indexes')

			// Track the execution for timing/update purposes
			// As well as throttling management
			const repoSyncActivity = await activityManager.createActivity(ActivityType.RepoSync,repoId)
			log.info(`Creating repo sync activity ${repo.full_name}: ${repoSyncActivity.id} with timestamp ${new Date(repoSyncActivity.timestamp)}`)

			// Reload all the issues
			repoActions.loadIssues()

			// Reload current issue if loaded
			const currentIssue = repoActions.state.issue
			if (currentIssue) {
				log.debug('Reloading current issue')
				repoActions.loadIssue(currentIssue,true)
			}

			// Notify of completion
			toaster.addMessage(`Finished ${this.name}`)

		} catch (err) {
			log.error('failed to sync repo issues', err)
			appActions.addErrorMessage(err)
			repoActions.setSyncStatus(availRepo, SyncStatus.Failed, {error: err})
		}
	}
}