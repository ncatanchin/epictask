import {Container,AutoWired,Inject} from 'typescript-ioc'
import * as moment from 'moment'

import ActivityManagerService from '../ActivityManagerService'

import {JobHandler} from 'shared/actions/jobs/JobHandler'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'

import {GitHubClient} from 'shared/GitHubClient'
import {SyncStatus,User,Repo,AvailableRepo,Comment,ActivityType} from 'shared/models'

import {Stores} from '../DBService'
import {Settings} from 'shared/Settings'
import Toaster from 'shared/Toaster'
import {Benchmark, RegisterJob} from 'shared/util/Decorations'
import {Job, IJob} from 'shared/actions/jobs/JobState'


const log = getLogger(__filename)

const Benchmarker = Benchmark('RepoSyncJob')



@RegisterJob
export class RepoSyncJob extends Job {


	client:GitHubClient = Container.get(GitHubClient)

	lastSyncParams:any
	oneAtATime = true
	availableRepo:AvailableRepo
	repo:Repo

	constructor(public job:IJob = null) {
		super(job)


		if (job) {
			const {availableRepo,repo} = job.args
			Object.assign(this,{availableRepo,repo})
			this.description = `repo sync (${repo.full_name})`
		}
	}

	/**
	 * Init params
	 *
	 * @param repo
	 */
	@Benchmarker
	async initParams(activityManager,repo) {
		assert(Settings.token,'Can not sync when not authenticated')


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
	@Benchmarker
	async syncCollaborators(stores:Stores,repo:Repo) {
		const userRepo = stores.user

		const collabsPromise = (repo.permissions.push) ?
			this.client.repoCollaborators(repo) :
			this.client.repoContributors(repo)



		// Make sure we have all the collaborators saved
		const collabs = await collabsPromise

		// Iterate all attahed users and make sure we
		// update the repoIds on the user object if
		// already exists
		for (let user of collabs) {
			const existingUser = await userRepo.findByLogin(user.login)
			if (existingUser) {
				user = new User(_.merge(user,existingUser))
			}

			user.addRepoId(repo.id)
		}



		//log.debug(`Loaded collabs/users, time to persist`, collabs)
		await userRepo.bulkSave(...collabs)
	}

	/**
	 * Synchronize all issues
	 *
	 * @param repo
	 */
	@Benchmarker
	async syncIssues(stores:Stores,repo) {
		const issues = await this.client.repoIssues(repo,{params:this.lastSyncParams})
		issues.forEach(issue => issue.repoId = repo.id)
		await stores.issue.bulkSave(...issues)
	}

	/**
	 * Synchronize all labels
	 *
	 * @param repo
	 */
	@Benchmarker
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
	@Benchmarker
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
	@Benchmarker
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
	@Benchmarker
	async executor(handler:JobHandler) {
		const activityManager = Container.get(ActivityManagerService)
		const stores = Container.get(Stores)
		const toaster = Container.get(Toaster)
		const repoActions =  Container.get(RepoActionFactory)
		const appActions = Container.get(AppActionFactory)

		const {availableRepo,repo} = this



		if (!Settings.token) {
			log.info("Can not sync, not authenticated")
			return
		}

		const {job} = handler

		log.debug(`Starting repo sync job: `, job.id)
		try {

			// Grab the repo
			let {repoId} = availableRepo

			// Check the last updated activity
			await this.initParams(activityManager,repo)

			// Load the issues, eventually track progress
			log.debug('waiting for all promises')
			await Promise.all([
				this.syncIssues(stores,repo),
				this.syncLabels(stores,repo),
				this.syncMilestones(stores,repo),
				this.syncComments(stores,repo),
				//this.syncCollaborators(stores,repo)
			])

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
			repoActions.setSyncStatus(availableRepo, SyncStatus.Failed, {error: err})
		}
	}
}