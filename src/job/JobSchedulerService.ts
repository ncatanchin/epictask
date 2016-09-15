
import DefaultJobSchedules from './JobSchedules'
import {IJobSchedule} from "shared/actions/jobs/JobTypes"
import {BaseService, RegisterService, IServiceConstructor} from "shared/services"
import {JobManagerService} from "job/JobManagerService"
import {JobActionFactory} from "shared/actions/jobs/JobActionFactory"
import * as moment from 'moment'
import { JobKey } from "shared/Constants"
import { getActionClient } from "shared/AppStoreClient"
import JobDAO from "shared/actions/jobs/JobDAO"
const log = getLogger(__filename)


interface IJobScheduleWrapper {
	scheduler:Later.IScheduleData
	schedule:IJobSchedule
	timer?:Later.ITimer
}


// Type for scheduled job map
type TJobScheduleMap = {[scheduledId:string]:IJobScheduleWrapper}


let jobScheduler:JobSchedulerService


@RegisterService(ProcessType.JobServer)
export class JobSchedulerService extends BaseService {
	
	static getInstance() {
		if (!jobScheduler) {
			jobScheduler = new JobSchedulerService()
		}
		
		return jobScheduler
	}
	
	
	/**
	 * Schedules
	 */
	private schedules:TJobScheduleMap = {}
	
	
	/**
	 * Job actions
	 */
	private actions:JobActionFactory
	
	/**
	 * Constructor ensures singleton
	 */
	constructor() {
		super()
		
		this.actions = getActionClient(JobKey)
		assert(!jobScheduler,`Job Scheduler can only be instantiated once`)
	}
	
	dependencies(): IServiceConstructor[] {
		return [JobManagerService]
	}
	
	/**
	 * Create a job executor function for a schedule wrapper
	 *
	 * @param wrapper
	 * @returns {()=>undefined}
	 */
	private makeExecutor(wrapper:IJobScheduleWrapper) {
		return () => {
			const {schedule} = wrapper
			JobDAO.create(schedule.type,schedule.description,schedule.args)
			schedule.lastTimestamp = new Date()
			
			this.schedule(wrapper)
			
		}
	}
	
	/**
	 * Schedule the next execution of a job - clear any pending
	 * @param wrapper
	 */
	private schedule(wrapper:IJobScheduleWrapper) {
		if (wrapper.timer) {
			wrapper.timer.clear()
			wrapper.timer = null
		}
		
		if (!this.isRunning) {
			log.warn(`Can not schedule ${wrapper.schedule.type} / service is stopped`)
			
		} else {
			
			wrapper.timer = later.setTimeout(this.makeExecutor(wrapper), wrapper.scheduler)
			
			const nextOccurrence = later.schedule(wrapper.scheduler).next(1)
			assign(wrapper.schedule, {
				nextTimestamp: Array.isArray(nextOccurrence) ? nextOccurrence[0] : nextOccurrence,
				nextText: moment(nextOccurrence).fromNow()
			})
			
			log.info(`Scheduled Job ${wrapper.schedule.name} occurs next ${wrapper.schedule.nextText}`)
		}
		
		
		// Create list of all schedules
		const allSchedules = Object.values(this.schedules).map(wrapper => wrapper.schedule)
		
		// Set on state
		this.actions.setSchedules(...allSchedules)
	}
	
	/**
	 * Load a schedule and configure it
	 * @param schedule
	 */
	private loadSchedule = (schedule:IJobSchedule) => {
		this.schedule(this.schedules[schedule.id] = {
			schedule,
			scheduler: later.parse.cron(schedule.cron)
		})
	}
	
	/**
	 * Load and configure job schedules
	 */
	private loadSchedules() {
		DefaultJobSchedules.forEach(this.loadSchedule)
	}
	
	
	
	
	
	start(): Promise<this> {
		log.info(`Starting Job Scheduler`)
		//this.actions = Container.get(JobActionFactory)
		this.loadSchedules()
		
		return super.start()
	}
	
	stop(): Promise<this> {
		log.info(`Stopping Job Scheduler`)
		return super.stop()
	}
}

if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}