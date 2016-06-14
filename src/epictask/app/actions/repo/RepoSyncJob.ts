import {IJobRequest} from 'app/actions/jobs/JobState'
import {JobHandler} from 'app/actions/jobs/JobHandler'
import {JobActionFactory} from 'app/actions/jobs/JobActionFactory'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {AppActionFactory} from 'app/actions/AppActionFactory'
import {ActivityManager,ToastManager} from 'app/services'
import * as moment from 'moment'

import {GitHubClient} from 'shared/GitHubClient'
import {SyncStatus, AvailableRepo,Comment,ActivityType,github} from 'shared'
import {Repos,Indexes} from 'shared/DB'
import {LunrIndex} from 'shared/LunrIndex'

const log = getLogger(__filename)

export class RepoSyncJob implements IJobRequest {

	name:string
	client:GitHubClient
	lastSyncParams:any
	oneAtATime = true

	constructor(private availRepo:AvailableRepo) {
		this.name = `syncing ${availRepo.repo.full_name}`
		this.client = github.createClient()
	}

	/**
	 * Init params
	 *
	 * @param repo
	 */
	async initParams(repo) {
		const lastActivity = await ActivityManager.findLastActivity(ActivityType.RepoSync,repo.id)
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
	async syncIssues(repo) {
		const issues = await this.client.repoIssues(repo,{params:this.lastSyncParams})
		issues.forEach(issue => issue.repoId = repo.id)
		log.debug(`Loaded issues, time to persist`, issues)
		await Repos.issue.bulkSave(...issues)
	}

	/**
	 * Synchronize all labels
	 *
	 * @param repo
	 */
	async syncLabels(repo) {
		const labels = await this.client.repoLabels(repo)
		labels.forEach(label => label.repoId = repo.id)
		log.debug(`Loaded labels, time to persist`, labels)
		await Repos.label.bulkSave(...labels)
	}

	/**
	 * Synchronize all milestones in the repository
	 *
	 * @param repo
	 */
	async syncMilestones(repo) {
		const milestones = await this.client.repoMilestones(repo)
		milestones.forEach(milestone => milestone.repoId = repo.id)
		log.debug(`Loaded milestones, time to persist`, milestones)
		await Repos.milestone.bulkSave(...milestones)
	}

	/**
	 * Synchronize all comments in the repository
	 *
	 * @param repo
	 */
	async syncComments(repo) {
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

		log.debug(`Loaded comments, time to persist`, comments)
		await Repos.comment.bulkSave(...comments)
	}

	/**
	 * Job executor
	 *
	 * @param handler
	 */
	async executor(handler:JobHandler) {
		const {availRepo} = this

		const actions = new RepoActionFactory()
		const appActions = new AppActionFactory()

		const {job} = handler

		log.debug(`Starting repo sync job: `, job.id)
		try {

			// Grab the repo
			let {repo, repoId} = availRepo
			if (!repo) repo = await actions.getRepo(repoId)

			// Check the last updated activity
			await this.initParams(repo)

			// Load the issues, eventually track progress
			log.debug('waiting for all promises')
			await Promise.all([
				this.syncIssues(repo),
				this.syncLabels(repo),
				this.syncMilestones(repo),
				this.syncComments(repo)
			])

			// Commit all text indexes
			log.debug(`Updating all indexes now`)
			await LunrIndex.persistAll()
			log.debug('Persisted all indexes')

			// Track the execution for timing/update purposes
			// As well as throttling management
			const repoSyncActivity = await ActivityManager.createActivity(ActivityType.RepoSync,repoId)
			log.info(`Creating repo sync activity ${repo.full_name}: ${repoSyncActivity.id} with timestamp ${new Date(repoSyncActivity.timestamp)}`)

			// Reload all the issues
			actions.loadIssues()

			// Reload current issue if loaded
			const currentIssue = actions.state.issue
			if (currentIssue) {
				log.debug('Reloading current issue')
				actions.loadIssue(currentIssue,true)
			}

			// Notify of completion
			ToastManager.addMessage(`Finished ${this.name}`)

		} catch (err) {
			log.error('failed to sync repo issues', err)
			appActions.addErrorMessage(err)
			actions.setSyncStatus(availRepo, SyncStatus.Failed, {error: err})
		}
	}
}