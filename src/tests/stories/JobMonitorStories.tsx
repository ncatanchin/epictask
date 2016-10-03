// Setup story environment
import {getDecorator} from "./StoryHelper"

import {JobActionFactory} from "shared/actions/jobs/JobActionFactory"
import {JobType, IJob, JobStatus, JobLogLevelNames} from "shared/actions/jobs/JobTypes"
import {Button} from 'ui/components/common'
import {jobStateSelector} from "shared/actions/jobs/JobSelectors"
import {getStoreState} from "shared/store"
import {JobMonitor} from "ui/plugins/jobs/JobMonitor"
import * as uuid from 'node-uuid'
import * as faker from 'faker'
import {makeDefaultToolPanel, ToolPanelLocation, makeDefaultTool} from "shared/tools/ToolTypes"
import {BuiltInTools, getBuiltInToolId} from "shared/config/ToolConfig"
import JobDAO from "shared/actions/jobs/JobDAO"
const {storiesOf, action, linkTo} = require('@kadira/storybook')


function makeJobWithStatus(type:JobType,status:JobStatus = JobStatus.Created,args:any = null,progress = 0) {
	const
		jobActions = Container.get(JobActionFactory),
		{job,detail} = JobDAO.create(type,null,args)
	
	job.status = detail.status = status
	detail.progress = progress
	jobActions.update(job,detail)
	
	return {
		job,
		detail
		}
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
		const
			panel = makeDefaultToolPanel(ToolPanelLocation.Bottom,true),
			tool = makeDefaultTool(getBuiltInToolId(BuiltInTools.JobMonitor))
		return <JobMonitor tool={tool} panel={panel} visible={true} />
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
		
		const
			makeId = (index) => `${uuid.v4()}-${index}-${Math.round((Math.random() * 100))}`,
			COUNT = 20
		
		let
			time = Date.now(),
			startTime =  time - (60 * 60 * 10000),
			timeRange = time - startTime,
			increment = timeRange / COUNT
		
		for (let i = 0; i < COUNT;i++) {
		 	const level = faker.random.arrayElement(JobLogLevelNames.slice(1))
			
			const error =  (level !== 'ERROR') ?
				null :
		 		new Error(faker.lorem.sentence(10))
			
			// JobDAO.logRecord(
		 	// 	job.id,
			//   makeId(i),
			//   JobLogLevel[level],
			//   faker.lorem.sentence(faker.random.number(20)),
			//   startTime + (i * increment),
			// 	error
			// )
				
		}
		
		jobActions.setSelectedId(job.id)
		const
			panel = makeDefaultToolPanel(ToolPanelLocation.Bottom,true),
			tool = makeDefaultTool(getBuiltInToolId(BuiltInTools.JobMonitor))
		return <JobMonitor tool={tool} panel={panel} visible={true} />
	})
	
	
	// In-Progress Job with status & timing
	.add('In-Progress Job @ 35%, 4m left + logs', () => {
		
		
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
		
		
		const
			panel = makeDefaultToolPanel(ToolPanelLocation.Bottom,true),
			tool = makeDefaultTool(getBuiltInToolId(BuiltInTools.JobMonitor))
		
		return <div>
			<Button onClick={onReset}>Reset</Button>
			<JobMonitor id={job.id} tool={tool} panel={panel} visible={true} />
		</div>
	})
