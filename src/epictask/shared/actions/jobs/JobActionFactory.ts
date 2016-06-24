
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import * as assert from 'assert'
import * as uuid from 'node-uuid'
import {ActionFactory,Action} from 'typedux'
import {JobKey} from "epictask/shared/Constants"
import {JobState,JobMessage,IJob,IJobRequest,IScheduledJob} from './JobState'
import {JobHandler} from './JobHandler'


/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/

export class JobActionFactory extends ActionFactory<any,JobMessage> {

	constructor() {
		super(JobState)
	}

	leaf():string {
		return JobKey;
	}

	@Action()
	createJob(request:IJobRequest) {
	}

	@Action()
	updateJob(job:IJob) {}

	@Action()
	removeJob(job:IJob) {}

	@Action()
	addScheduledJob(scheduledJob:IScheduledJob) {}

	/**
	 * Schedules a job for execution one or more times
	 *
	 * @param request
	 */
	scheduleJob(request:IJobRequest) {
		assert.ok(request && !_.isNil(request.schedule) && !_.isNil(request.repeat),
			'Only jobs with a schedule and non-null (false is ok) value for repeat can be scheduled')


		const {schedule} = request
		const scheduler:Later.IScheduleData = (_.isString(schedule)) ? later.parse.cron(schedule) :
			schedule()

		const scheduledJob:IScheduledJob = Object.assign({},request,{
			id: uuid.v4(),
			scheduler
		})

		this.addScheduledJob(scheduledJob)
	}

	@Action()
	processJob(job:IJob):Promise<IJob> {
		return (async (dispatcher,getState) => {
			const actions = this.withDispatcher(dispatcher,getState)
			const handler = new JobHandler(actions,job)

			log.info(`Starting job handler for job: (id=${job.id})`)
			await handler.execute()

		}) as any
	}
}