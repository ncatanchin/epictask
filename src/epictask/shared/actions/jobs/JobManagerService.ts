import {ObservableStore} from 'typedux'
import {JobActionFactory as JobActionFactoryType} from 'shared/actions/jobs/JobActionFactory'
import {RepoActionFactory as RepoActionFactoryType} from 'shared/actions/repo/RepoActionFactory'
import {IJob,IScheduledJob,findInProgressJob} from 'shared/actions/jobs/JobState'
import {JobStatus} from 'shared/actions/jobs/JobStatus'
import {JobHandler} from 'shared/actions/jobs/JobHandler'

const log = getLogger(__filename)

let store:ObservableStore<any>
let jobActions:JobActionFactoryType
let repoActions:RepoActionFactoryType

let workingJobs = {}
let scheduledJobs:{[name:string]:IScheduledJob} = {}

const syncAllReposJob = {
	name: 'Sync-Enabled Repos',
	schedule: '*/10 * * * *', // Every 10 minutes
	repeat: true,
	oneAtATime: true,
	executor: async (handler:JobHandler) => {
		log.info(`Starting to sync all repos`)
		const {RepoActionFactory} = require('shared/actions/repo/RepoActionFactory')
		repoActions = new RepoActionFactory()
		repoActions.syncAllRepoDetails()

	}
}


async function executeJob(job:IJob) {
	workingJobs[job.id] = job
	log.info(`Executing job ${job.id}`)
	const handler = new JobHandler(jobActions,job)
	await handler.execute()
	log.info(`Job Completed`)
}

function updateJobs(newJobs:IJob[]) {

	// Pending jobs = any job that is 'Created' and we dont know about
	const pendingJobs = newJobs
		.filter(job => job.status === JobStatus.Created && !workingJobs[job.id])

	pendingJobs.forEach(executeJob)
}

function clearScheduledJob(job:IScheduledJob) {
	log.debug(`Removing job ${job.name}`)
	if (job.timer) {
		log.debug(`Calling cancel on ${job.name}/${job.id}`)
		job.timer.clear()
	}

	delete scheduledJobs[job.id]
}

function scheduledJobToRequest(job) {
	return {
		name: job.name,
		oneAtATime: job.oneAtATime,
		executor: job.executor
	}
}

function scheduledJobExecutor(job:IScheduledJob) {
	return () => {
		if (job.oneAtATime) {
			const existingJob = findInProgressJob(jobActions.state,job)
			if (existingJob) {
				log.info(`Scheduled job ${job.name} is already executing, lets wait till next time`, existingJob,job)
				return
			}
		}

		const jobRequest = scheduledJobToRequest(job)

		log.info(`Creating scheduled job execution`,job,jobRequest)

		jobActions.createJob(jobRequest)
	}
}

function updateScheduledJobs(newScheduledJobs:IScheduledJob[]) {
	const
		allIds = newScheduledJobs.map(job => job.id),
		allNames = newScheduledJobs.map(job => job.name),
		oldIds = Object.keys(scheduledJobs),
		oldNames = oldIds.map(id => scheduledJobs[id].name),
		removedIds = oldIds.filter(id => !allIds.includes(id)),
		removedJobs = removedIds.map(id => scheduledJobs[id]),
		newIds = allIds.filter(id => !oldIds.includes(id)),
		newJobs = _.clone(newScheduledJobs.filter(job => newIds.includes(job.id)))

	log.debug('Scheduling new jobs', newJobs, ' and removing ', removedJobs)

	// Remove + clear jobs first
	removedJobs.forEach(clearScheduledJob)

	newJobs.forEach(job => {
		const executor = scheduledJobExecutor(job)
		job.timer = (job.repeat) ? later.setInterval(executor,job.scheduler) :
			later.setTimeout(executor,job.scheduler)

		scheduledJobs[job.id] = job
	})

}

export async function start() {
	// We use this loading method for HMR
	store = require('shared/store').getStore()
	const {JobActionFactory} = require('shared/actions/jobs/JobActionFactory')
	jobActions = new JobActionFactory()

	// Now load everything
	const {state} = jobActions
	updateJobs(state.jobs)
	updateScheduledJobs(state.scheduledJobs)


	jobActions.createJob(scheduledJobToRequest(syncAllReposJob))
	jobActions.scheduleJob(syncAllReposJob)

	store.observe([jobActions.leaf(),'jobs'],(newJobs) => {
		log.debug('Check new jobs for anything that need to be worked')
		updateJobs(newJobs)
	})

	store.observe([jobActions.leaf(),'scheduledJobs'],(newScheduledJobs) => {
		log.debug('Scheduled jobs changed',newScheduledJobs)
		updateScheduledJobs(newScheduledJobs)
	})



	// setTimeout(() => {
	// 	jobActions.createJob(syncAllReposJob)
	//
	// },100)

}


if (module.hot) {
	module.hot.accept([],(updates) => {
		log.info('HMR updates for job manager', updates)
		start()
	})
}
