

import {IJobSchedule, JobType} from "../shared/actions/jobs/JobTypes"

const Schedules:IJobSchedule[] = [
	
	// Sync User Repos w/Github every 20m
	{
		id: "GetUserRepos",
		name: JobType[JobType.GetUserRepos],
		description: "Synchronize User Repos",
		type: JobType.GetUserRepos,
		cron: '*/30 * * * *', // Every 20 minutes
	},
	
	// Sync Enabled/Available Repos every 30m
	// TODO: implement notifications to trigger when needed
	{
		id: "SyncEnabledRepos",
		name: JobType[JobType.SyncEnabledRepos],
		description: "Synchronize Enabled Repositories",
		type: JobType.SyncEnabledRepos,
		cron: '*/10 * * * *'
		
	}
]

export default Schedules