
/**
 * Re-export all job types
 */
export * from "shared/actions/jobs/JobTypes"

// Imports
import {List,Map,Record} from 'immutable'
import {RegisterModel} from 'shared/Registry'
import {IJob, IJobSchedule, IJobStatusDetail} from "shared/actions/jobs/JobTypes"


// Logger
const log = getLogger(__filename)



/**
 * JobStateRecord, holds available properties
 *
 * @type {Immutable.Record.Class|any}
 */
export const JobStateRecord = Record({
	details:List<IJobStatusDetail>(),
	all:Map<string,IJob>(),
	error:null,
	schedules:Map<string,IJobSchedule>(),
	selectedId: null,
	selectedLogId: null
	
})


/**
 * Keeps track of ongoing job
 * information status and scheduling
 */
@RegisterModel
export class JobState extends JobStateRecord {

	static fromJS(o:any) {
		if (o && o instanceof JobState)
			return o
		
		return new JobState(Object.assign({},o,{
			all: Map(o.all),
			details: List(o.details),
			schedules: Map(o.schedules)
		}))
	}
	
	toJS() {
		return {}
	}
	
	/**
	 * Find a job status detail record for a job
	 *
	 * @param jobId
	 * @returns {IJobStatusDetail}
	 */
	getDetail(jobId:string):IJobStatusDetail {
		return this.details.find(detail => detail.id === jobId)
	}
	
	all:Map<string,IJob>
	details:List<IJobStatusDetail>
	schedules:Map<string,IJobSchedule>
	error:Error
	
	/**
	 * Selected Job Id
	 */
	selectedId:string
	
	/**
	 * Selected log id
	 */
	selectedLogId:string
}

