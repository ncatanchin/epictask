import {Container,AutoWired,Inject} from 'typescript-ioc'
import * as moment from 'moment'

import ActivityManagerService from '../ActivityManagerService'

import {JobHandler} from 'shared/actions/jobs/JobHandler'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'

import {GitHubClient} from 'shared/GitHubClient'
import {SyncStatus,User,Repo,AvailableRepo,Comment,ActivityType} from 'shared/models'

import {Stores,chunkSave,chunkRemove} from '../DBService'
import {Settings} from 'shared/Settings'
import Toaster from 'shared/Toaster'
import {Benchmark} from 'shared/util/Benchmark'
import {RegisterJob} from 'shared/util/Decorations'
import {Job, IJob} from 'shared/actions/jobs/JobState'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {issueModelsSelector} from 'shared/actions/data/DataSelectors'
import {getStoreState} from 'shared/store/AppStore'
import {enabledRepoIdsSelector} from 'shared/actions/repo/RepoSelectors'
import {selectedIssueSelector} from 'shared/actions/issue/IssueSelectors'



const log = getLogger(__filename)

const Benchmarker = Benchmark('RepoSyncJob')



@RegisterJob
export class RepoSyncJob extends Job {


	client:GitHubClient

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
	 * @param stores
	 * @param repo
	 */
	@Benchmarker
	async syncCollaborators(stores:Stores,repo:Repo) {
		const userRepo = stores.user
		if (!(repo.permissions.push || repo.permissions.admin)) {
			log.debug(`Admin/Push access not granted for ${repo.full_name}, can not get collaborators`)
			return
		}
		const users:User[] = await this.client.repoCollaborators(repo)
		//this.client.repoContributors(repo)



		// Make sure we have all the collaborators saved
		//const collabs = await collabsPromise

		// Iterate all attahed users and make sure we
		// update the repoIds on the user object if
		// already exists
		const existingUserIds = await userRepo.findAll()
		const updatePromises = []
		users.forEach(user => {
			if (existingUserIds.includes(user.id)) {
				// Look for an existing user first
				updatePromises.push(userRepo.get(user.id)
					.then(existingUser => {
						if (existingUser) {
							assign(user,existingUser,_.cloneDeep(user))
						}
					}))

			}
		})

		await Promise.all(updatePromises)

		users.forEach(user => user.addRepoId(repo.id))


		log.info(`Total collabs for ${repo.full_name} is ${users.length}`)
		await chunkSave(users,userRepo)

		log.info(`Updated ${users.length} for repo ${repo.full_name}`)




	}

	/**
	 * Synchronize all issues
	 *
	 * @param stores
	 * @param repo
	 */
	@Benchmarker
	async syncIssues(stores:Stores,repo) {
		const issues = await this.client.repoIssues(repo,{
			params: assign({state: 'all'},this.lastSyncParams)
		})

		for (let issue of issues) {
			issue.repoId = repo.id
			const existing = await stores.issue.get(issue.id)
			assign(issue,existing)
		}

		if (issues.length)
			await chunkSave(issues,stores.issue)

	}

	/**
	 * Synchronize all labels
	 *
	 * @param stores
	 * @param repo
	 */
	@Benchmarker
	async syncLabels(stores,repo) {
		const labels = await this.client.repoLabels(repo)
		for (let label of labels) {
			label.repoId = repo.id
			const existing = await stores.label.get(label.url)
			assign(label,existing)
		}


		//log.debug(`Loaded labels, time to persist`, labels)
		await chunkSave(labels,stores.label)
	}

	/**
	 * Synchronize all milestones in the repository
	 *
	 * @param stores
	 * @param repo
	 */
	@Benchmarker

	async syncMilestones(stores,repo) {
		const milestones = await this.client.repoMilestones(repo)

		for (let milestone of milestones) {
			milestone.repoId = repo.id
			const existing = await stores.milestone.get(milestone.id)
			assign(milestone,existing)
		}

		//log.debug(`Loaded milestones, time to persist`, milestones)
		await chunkSave(milestones,stores.milestone)
	}

	/**
	 * Synchronize all comments in the repository
	 *
	 * @param repo
	 */
	@Benchmarker /**
	 * @param stores
	 */

	async syncComments(stores,repo) {
		let comments = await this.client.repoComments(repo,{params:this.lastSyncParams})

		// Filter JUST in case there are some missing issue urls
		//comments = comments.filter(comment => comment.issue_url)

		// Fill in the fields we tack directly
		for (let comment of comments) {
			if (!comment.issue_url) {
				log.error(`Comment is missing issue url`, comment)
				return
			}
			const existing = await stores.milestone.get(comment.id)
			assign(comment,existing)

			comment.repoId = repo.id

			const issueIdStr = comment.issue_url.split('/').pop()

			comment.issueNumber = parseInt(issueIdStr,10)
			comment.parentRefId = Comment.makeParentRefId(repo.id,comment.issueNumber)


		}

		//log.debug(`Loaded comments, time to persist`, comments)
		await chunkSave(comments,stores.comment)
	}

	/**
	 * Job executor
	 *
	 * @param handler
	 */
	@Benchmarker
	async executor(handler:JobHandler) {
		if (!Settings.token) {
			log.info(`User is not authenticated, can not sync`)
			return
		}

		this.client = Container.get(GitHubClient)

		const activityManager = Container.get(ActivityManagerService)
		const stores = Container.get(Stores)
		const toaster = Container.get(Toaster)
		const repoActions =  Container.get(RepoActionFactory)
		const issueActions =  Container.get(IssueActionFactory)
		const dataActions =  Container.get(DataActionFactory)
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
			log.debug('waiting for all promises - we sync comments later ;)')
			await Promise.all([
				this.syncIssues(stores,repo),
				this.syncLabels(stores,repo),
				this.syncMilestones(stores,repo),
				this.syncCollaborators(stores,repo)
			])

			// Track the execution for timing/update purposes
			// As well as throttling management
			const repoSyncActivity = await activityManager.createActivity(ActivityType.RepoSync,repoId)
			log.info(`Creating repo sync activity ${repo.full_name}: ${repoSyncActivity.id} with timestamp ${new Date(repoSyncActivity.timestamp)}`)

			// Now get the store state to check if updates are needed


			// If the current repo is not enabled then return
			const enabledRepoIds = enabledRepoIdsSelector(getStoreState())
			if (!enabledRepoIds.includes(repo.id)) return

			// Reload issues first
			await issueActions.loadIssues()

			log.info('Now syncing comments')
			await Promise.delay(2000)
			await this.syncComments(stores,repo)

			// Reload current issue if loaded
			let currentIssueId = issueActions.state.selectedIssueId
			if (currentIssueId) {

				const issue = selectedIssueSelector(getStoreState())

				log.debug('Checking if current issue is in this repo, if so then reload',
					_.get(issue,'id'),'repoId = ',repo.id,'issue repo id =', _.get(issue,'repoId'))

				// If the issue is loaded and in this repo then reload its activity
				if (issue && issue.repoId === repo.id)
					issueActions.loadActivityForIssue(issue.id)
			}



			// Notify of completion
			//toaster.addMessage(`Finished ${this.name}`)

		} catch (err) {
			log.error('failed to sync repo issues', err)
			toaster.addErrorMessage(err)
		}
	}
}
