// Setup story environment
import {getDecorator} from "./StoryHelper"

import {StatusBar} from 'ui/components/root/StatusBar'
import {JobActionFactory} from "shared/actions/jobs/JobActionFactory"
import {JobType, IJob, JobStatus} from "shared/actions/jobs/JobTypes"
import {Button} from 'ui/components/common/Button'
import {jobStateSelector} from "shared/actions/jobs/JobSelectors"
import {getStoreState} from "shared/store"
import {addErrorMessage, addMessage, addSuccessMessage, clearMessages} from "shared/Toaster"
import JobDAO from "shared/actions/jobs/JobDAO"

const {storiesOf, action, linkTo} = require('@kadira/storybook')


// logger
const log = getLogger(__filename)

storiesOf('StatusBar',module)
	.addDecorator(getDecorator)
	
	// Single Job - no updates
	.add('With Info Message', () => {
		clearMessages()
		addMessage('Some info can be nice ;)')
		
		return <StatusBar />
	})
	
	// Single Job - no updates
	.add('With Success Message', () => {
		clearMessages()
		addSuccessMessage('Good = good / ALWAYS')
		
		return <StatusBar />
	})
	
	// Single Job - no updates
	.add('With Error Message', () => {
		clearMessages()
		addErrorMessage('Arg an error occurred!')
		
		return <StatusBar />
	})
		
	// Single Job - no updates
	.add('With Job', () => {
		
		JobDAO.create(JobType.GetUserRepos)
		
		return <StatusBar />
	})
	
	// Job & Message
	.add('With Job & Message', () => {
		clearMessages()
		addSuccessMessage('This is good')
		
		JobDAO.create(JobType.GetUserRepos)
		
		return <StatusBar />
	})
	
	// Single Job - Success
	.add('With Job / SUCCESS', () => {
		const jobActions = Container.get(JobActionFactory)
		jobActions.clear()
		
		const {job,detail} = JobDAO.create(JobType.GetUserRepos)
		
		job.status = detail.status = JobStatus.Completed
		detail.progress = 1
		jobActions.update(job,detail)
		
		return <StatusBar />
	})
	
	.add('With Job / FAILED', () => {
		
		const jobActions = Container.get(JobActionFactory)
		jobActions.clear()
		
		const {job,detail} = JobDAO.create(JobType.GetUserRepos)
		
		job.status = detail.status = JobStatus.Failed
		detail.progress = 1
		jobActions.update(job,detail)
		
		return <StatusBar />
	})
		
	// In-Progress Job with status & timing
	.add('With Job @ 35%, 4m left + logs', () => {
		
		
		const
			createJob = (existingJob:IJob = null) => {
				// Remove job
				if (existingJob)
					jobActions.remove(existingJob.id)
				
				return JobDAO.create(JobType.GetUserRepos)
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
			<StatusBar />
		</div>
	})
