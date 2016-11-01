

// Imports
import {List,Map,Record} from 'immutable'
import {RegisterModel} from "epic-global"
import {IJob, IJobSchedule, IJobStatusDetail} from "./jobs/JobTypes"
import { toPlainObject } from "typetransform"
import { reviveImmutable } from "epic-global/ModelUtil"


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
		return reviveImmutable(
			o,
			JobState,
			['details'],
			['all','schedules']
		)
	}
	
	toJS() {
		return toPlainObject(this)
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
	
}

