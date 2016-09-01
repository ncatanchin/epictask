// Setup story environment
import {getDecorator} from "./StoryHelper"

import {StatusBar} from 'ui/components/root/StatusBar'
import {JobActionFactory} from "shared/actions/jobs/JobActionFactory"
import {JobType, IJob, JobStatus} from "shared/actions/jobs/JobTypes"
import {Button} from "components/common"
import {jobStateSelector} from "shared/actions/jobs/JobSelectors"
import {getStoreState} from "shared/store"
import {addErrorMessage, addMessage, addSuccessMessage, clearMessages} from "shared/Toaster"
import {JobMonitor} from "ui/components/root/JobMonitor"

const {storiesOf, action, linkTo} = require('@kadira/storybook')


// logger
const log = getLogger(__filename)

storiesOf('Job Monitor',module)
	.addDecorator(getDecorator)
	
	// JobMonitor - no logs
	.add('Without logs', () => {
		const
			jobActions = Container.get(JobActionFactory),
			{job:{id}} = jobActions.create(JobType.GetUserRepos)
		
		return <JobMonitor id={id} />
	})
	
	// JobMonitor - logs
	.add('With logs', () => {
		const
			jobActions = Container.get(JobActionFactory),
			{job,detail} = jobActions.create(JobType.GetUserRepos)
		
		
		job.status = detail.status = JobStatus.Completed
		detail.progress = 1
		jobActions.update(job,detail)
		
		return <JobMonitor id={job.id} />
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
