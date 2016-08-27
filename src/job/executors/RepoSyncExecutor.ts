import * as moment from 'moment'

import ActivityManagerService from 'shared/services/ActivityManagerService'

import {JobHandler} from 'job/JobHandler'
import {GitHubClient, OnPageCallback} from 'shared/GitHubClient'
import {User,Repo,Milestone,Label,Issue,AvailableRepo,Comment,ActivityType} from 'shared/models'

import Toaster from 'shared/Toaster'
import {Stores,chunkSave} from 'shared/services/DatabaseClientService'
import {getSettings} from 'shared/Settings'
import {Benchmark} from 'shared/util/Benchmark'
import {JobExecutor} from 'job/JobDecorations'

import {JobType, IJob} from 'shared/actions/jobs/JobTypes'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'

import {getStoreState} from 'shared/store/AppStore'
import {enabledRepoIdsSelector} from 'shared/actions/repo/RepoSelectors'
import {selectedIssueSelector} from 'shared/actions/issue/IssueSelectors'
import {IJobExecutor} from "job/JobExecutors"



const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)



@JobExecutor
export class RepoSyncExecutor implements IJobExecutor {


	static supportedTypes() {
		return [JobType.RepoSync]
	}
	
	private client:GitHubClient
	private lastSyncParams:any
	private availableRepo:AvailableRepo
	private repo:Repo
	private job:IJob

	
	/**
	 * if dryRun argument was passed as true,
	 * prohibits persistence, etc
	 */
	isDryRun = () => _.get(this.job,'args.dryRun',false) === true
		

	/**
	 * Init params
	 *
	 * @param activityManager
	 * @param repo
	 */
	@Benchmarker
	async initParams(activityManager,repo) {
		assert(getSettings().token,'Can not sync when not authenticated')


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
	async syncAssignees(stores:Stores, repo:Repo,onPageCallback:OnPageCallback<User> = null) {
		/*
		if (!(repo.permissions.push || repo.permissions.admin)) {
			log.debug(`Admin/Push access not granted for ${repo.full_name}, can not get collaborators`)
			return
		}
		*/
		const users:User[] = await this.client.repoAssignees(repo,{onPageCallback})
		
		if (this.isDryRun())
			return users
		
		// Iterate all attached users and make sure we
		// update the repoIds on the user object if
		// already exists
		const userRepo = stores.user
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

		return users


	}

	/**
	 * Synchronize all issues
	 *
	 * @param stores
	 * @param repo
	 */
	@Benchmarker
	async syncIssues(stores:Stores,repo:Repo,onPageCallback:OnPageCallback<Issue> = null) {
		const issues = await this.client.repoIssues(repo,{
			onPageCallback,
			params: assign({
				state: 'all',
				sort: 'updated',
				filter: 'all'
			},this.lastSyncParams)
		})

		log.info(`Got ${issues.length} issues`)
		if (this.isDryRun())
			return issues
		
		for (let issue of issues) {
			issue.repoId = repo.id
			const existing = await stores.issue.get(issue.id)
			if (existing)
				assign(issue,existing,issue)
		}

		if (issues.length)
			await chunkSave(issues,stores.issue)

		return issues
	}

	/**
	 * Synchronize all labels
	 *
	 * @param stores
	 * @param repo
	 */
	@Benchmarker
	async syncLabels(stores,repo,onPageCallback:OnPageCallback<Label> = null) {
		const labels = await this.client.repoLabels(repo,{onPageCallback})
		
		if (this.isDryRun())
			return labels
		
		for (let label of labels) {
			label.repoId = repo.id
			const existing = await stores.label.get(label.url)
			if (existing)
				assign(label,existing,label)
		}


		await chunkSave(labels,stores.label)
		return labels
	}

	/**
	 * Synchronize all milestones in the repository
	 *
	 * @param stores
	 * @param repo
	 */
	@Benchmarker
	async syncMilestones(stores,repo,onPageCallback:OnPageCallback<Milestone> = null) {
		const milestones = await this.client.repoMilestones(repo,{params: {state: 'all'}})
		
		if (this.isDryRun())
			return milestones
		
		log.info(`Got ${milestones.length} milestones`)
		for (let milestone of milestones) {
			milestone.repoId = repo.id
			const existing = await stores.milestone.get(milestone.id)
			if (existing)
				assign(milestone,existing,milestone)
		}

		//log.debug(`Loaded milestones, time to persist`, milestones)
		await chunkSave(milestones,stores.milestone)
		return milestones
	}

	/**
	 * Synchronize all comments in the repository
	 *
	 * @param stores
	 * @param repo
	 */
	@Benchmarker

	async syncComments(stores,repo,onPageCallback:OnPageCallback<Comment> = null) {
		let comments = await this.client.repoComments(repo, {
			params: assign({sort: 'updated'}, this.lastSyncParams)
		})
		
		if (this.isDryRun())
			return comments

		// Fill in the fields we tack directly
		for (let comment of comments) {
			if (!comment.issue_url) {
				log.error(`Comment is missing issue url`, comment)
				return
			}
			const existing = await stores.milestone.get(comment.id)
			if (existing)
				assign(comment,existing,comment)

			comment.repoId = repo.id

			const issueIdStr = comment.issue_url.split('/').pop()

			comment.issueNumber = parseInt(issueIdStr,10)
			comment.parentRefId = Comment.makeParentRefId(repo.id,comment.issueNumber)


		}

		await chunkSave(comments,stores.comment)
		return comments
	}

	/**
	 * Job executor
	 *
	 * @param handler
	 * @param job
	 */
	@Benchmarker
	async execute(handler:JobHandler, job:IJob) {
		if (!getSettings().token) {
			log.warn(`User is not authenticated, can not sync`)
			return
		}
		
		if (job) {
			const {availableRepo,repo} = job.args
			
			Object.assign(this,{
				availableRepo,
				repo,
				job
			})
			
		}

		this.client = Container.get(GitHubClient)

		const activityManager = Container.get(ActivityManagerService)
		const stores = Container.get(Stores)
		const toaster = Container.get(Toaster)
		const issueActions =  Container.get(IssueActionFactory)

		const {availableRepo,repo} = this

		if (!getSettings().token) {
			log.info("Can not sync, not authenticated")
			return
		}

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
				this.syncAssignees(stores,repo)
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
			await Promise.delay(1)
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

		} catch (err) {
			log.error('failed to sync repo issues', err)
			toaster.addErrorMessage(err)
		}
	}
}
