import {IJobRequest} from 'app/actions/jobs/JobState'
import {JobHandler} from 'app/actions/jobs/JobHandler'
import {JobActionFactory} from 'app/actions/jobs/JobActionFactory'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {AppActionFactory} from 'app/actions/AppActionFactory'
import {ActivityManager,ToastManager} from 'app/services'
import * as moment from 'moment'

import {SyncStatus, AvailableRepo, ActivityType,github} from 'shared'
import {Repos,Indexes} from 'shared/DB'
import {LunrIndex} from 'shared/LunrIndex'



const log = getLogger(__filename)

export class RepoSyncJob implements IJobRequest {

	name:string


	constructor(private availRepo:AvailableRepo) {
		this.name = `syncing ${availRepo.repo.full_name}`
	}

	async executor(handler:JobHandler) {
		const {availRepo} = this

		const actions = new RepoActionFactory()
		const jobActions = new JobActionFactory()
		const appActions = new AppActionFactory()

		const {job} = handler

		log.debug(`Starting repo sync job: `, job.id)
		try {

			const client = github.createClient()

			// Grab the repo
			let {repo, repoId} = availRepo
			if (!repo) repo = await actions.getRepo(repoId)


			// Check the last updated activity
			const lastActivity = await ActivityManager.findLastActivity(ActivityType.RepoSync,repoId)
			const lastSyncTimestamp = new Date(lastActivity ? lastActivity.timestamp : 0)
			const lastSyncTimestamp8601 = moment(lastSyncTimestamp.getTime()).format()
			const lastSyncParams = {since: lastSyncTimestamp8601}
			if (lastActivity) {
				log.info(`Last repo sync for ${repo.full_name} was  ${moment(lastActivity.timestamp).fromNow()}`)
			}

			// Load the issues, eventually track progress
			async function syncIssues() {
				const issues = await client.repoIssues(repo,{params:lastSyncParams})
				issues.forEach(issue => issue.repoId = repo.id)
				log.debug(`Loaded issues, time to persist`, issues)
				await Repos.issue.bulkSave(...issues)
			}


			async function syncLabels() {
				const labels = await client.repoLabels(repo)
				labels.forEach(label => label.repoId = repo.id)
				log.debug(`Loaded labels, time to persist`, labels)
				await Repos.label.bulkSave(...labels)
			}

			async function syncMilestones() {
				const milestones = await client.repoMilestones(repo)
				milestones.forEach(milestone => milestone.repoId = repo.id)
				log.debug(`Loaded milestones, time to persist`, milestones)
				await Repos.milestone.bulkSave(...milestones)
			}

			log.debug('waiting for all promises')
			await Promise.all([syncIssues(), syncLabels(), syncMilestones()])
			log.debug('all promises completed, NOW SYNC COMMENTS')

			log.debug(`Updating all indexes now`)
			await LunrIndex.persistAll()
			log.debug('Persisted all indexes')


			const repoSyncActivity = await ActivityManager.createActivity(ActivityType.RepoSync,repoId)
			log.info(`Creating repo sync activity ${repo.full_name}: ${repoSyncActivity.id} with timestamp ${new Date(repoSyncActivity.timestamp)}`)

			await actions.loadIssues()

			ToastManager.addMessage(`Finished ${this.name}`)
			// await dispatch(actions.setSyncStatus(availRepo,SyncStatus.InProgress,{progress: 0}))
			//
			//
			// actions.setSyncStatus(availRepo,SyncStatus.Completed,{progress: 100})
		} catch (err) {
			log.error('failed to sync repo issues', err)
			appActions.addErrorMessage(err)
			actions.setSyncStatus(availRepo, SyncStatus.Failed, {error: err})
		}
	}
}