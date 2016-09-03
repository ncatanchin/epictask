// Setup story environment
import {getDecorator} from "./StoryHelper"

import {JobActionFactory} from "shared/actions/jobs/JobActionFactory"
import {JobType, IJob, JobStatus, JobLogLevel} from "shared/actions/jobs/JobTypes"
import {Button} from "components/common"
import {jobStateSelector} from "shared/actions/jobs/JobSelectors"
import {getStoreState} from "shared/store"
import {JobMonitor} from "ui/components/jobs/JobMonitor"
import * as uuid from 'node-uuid'

const {storiesOf, action, linkTo} = require('@kadira/storybook')


function makeJobWithStatus(type:JobType,status:JobStatus = JobStatus.Created,args:any = null,progress = 0) {
	const
		jobActions = Container.get(JobActionFactory),
		{job,detail} = jobActions.create(type,null,args)
	
	job.status = detail.status = status
	detail.progress = progress
	jobActions.update(job,detail)
	
	return {job,detail}
}

// logger
const log = getLogger(__filename)

storiesOf('Job Monitor',module)
	.addDecorator(getDecorator)
	
	// JobMonitor - no logs
	.add('Without logs', () => {
		
		const jobActions = Container.get(JobActionFactory)
		
		// Clear existing jobs first
		jobActions.clear()
		
		for (let i = 0; i < 4;i++) {
			makeJobWithStatus(JobType.GetUserRepos, JobStatus.Completed)
			makeJobWithStatus(JobType.SyncEnabledRepos, JobStatus.Failed)
			makeJobWithStatus(JobType.RepoSync, JobStatus.InProgress, {
				repo: {
					full_name: 'fake-repo/pringles'
				}
			}, 0.35)
			makeJobWithStatus(JobType.GetUserRepos)
		}
		return <JobMonitor />
	})
	
	// JobMonitor - logs
	.add('With logs', () => {
		const jobActions = Container.get(JobActionFactory)
		
		// Clear existing jobs first
		jobActions.clear()
		
		const {job} = makeJobWithStatus(JobType.RepoSync, JobStatus.InProgress, {
			repo: {
				full_name: 'fake-repo/pringles'
			}
		}, 0.35)
		
		for (let i = 0; i < 25;i++) {
			jobActions.log(job.id, uuid.v4(), JobLogLevel.INFO, 'Message #1', Date.now())
			jobActions.log(job.id, uuid.v4(), JobLogLevel.WARN, 'Be scared - very very scared', Date.now())
			jobActions.log(job.id, uuid.v4(), JobLogLevel.ERROR, 'Bad bad things are happening', Date.now(), new Error('World exploded'))
		}
		
		jobActions.setSelectedId(job.id)
		
		return <JobMonitor />
	})
	
	
	// In-Progress Job with status & timing
	.add('In-Progress Job @ 35%, 4m left + logs', () => {
		
		
		const
			createJob = (existingJob:IJob = null) => {
				// Remove job
				if (existingJob)
					jobActions.remove(existingJob.id)
				
				return jobActions.create(JobType.GetUserRepos)
			},
			jobActions = Container.get(JobActionFactory)
		
		jobActions.clear()
		
		let
			{job, detail} = createJob(),
			updateTimer = null
		
		
		
		
		const updateProgressAndETA = (newProgress, newEpochETA = Date.now() + (4 * 60 * 1000)) => {
			detail = _.cloneDeep(detail)
			detail.progress = newProgress
			detail.epochETA = newEpochETA
			
			if (detail.progress === 1) {
				job.status = JobStatus.Completed
				detail.status = JobStatus.Completed
			}
			
			jobActions.update(job, detail)
		}
		
		
		
		//Increment progress
		const incrementProgress = () => {
			const jobState = jobStateSelector(getStoreState())
			job = jobState.all.get(job.id)
			
			if (!job || detail.progress >= 1)
				return
			
			const
				by = Math.random() * 0.1,// 0.05,
				newProgress = Math.min(detail.progress + by, 1)
			
			log.info(`Incrementing progress by ${by} to ${newProgress}`)
			updateProgressAndETA(newProgress)
			// jobActions.update(job,detail)
			if (detail.progress < 1)
				updateTimer = setTimeout(() => incrementProgress(), 200)
			
		}
		
		setTimeout(incrementProgress,100)
		
		// Reset config
		const
			resetAction = action('reset'),
			onReset = () => {
				resetAction()
				if (updateTimer) {
					clearTimeout(updateTimer)
				}
				
				({job, detail} = createJob(job))
				
				incrementProgress()
			}
		
		
		
		return <div>
			<Button onClick={onReset}>Reset</Button>
			<JobMonitor id={job.id} />
		</div>
	})
