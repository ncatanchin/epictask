
import {getStore} from '../store/AppStore'
import {JobActionFactory} from '../actions/jobs/JobActionFactory'
import {IJob} from '../actions/jobs/JobState'
import {JobStatus} from '../actions/jobs/JobStatus'
import {JobHandler} from '../actions/jobs/JobHandler'

const store = getStore()
const jobActions = new JobActionFactory()
const log = getLogger(__filename)

let workingJobs = {}

async function updateJobs(newJobs:IJob[]) {

	// Pending jobs = any job that is 'Created' and we dont know about
	const pendingJobs = newJobs
		.filter(job => job.status === JobStatus.Created && !workingJobs[job.id])

	pendingJobs.forEach(async (job) => {
		workingJobs[job.id] = job
		log.info(`Executing job ${job.id}`)
		const handler = new JobHandler(jobActions,job)
		await handler.execute()
		log.info(`Job Completed`)
	})
}

export async function start() {
	updateJobs(jobActions.state.jobs)

	store.observe([jobActions.leaf(),'jobs'],(newJobs) => {
		log.debug('Check new jobs for anything that need to be worked')
		updateJobs(newJobs)
	})
}

