
import {List,Map,Record} from 'immutable'
import {RegisterModel} from 'shared/Registry'
import {JobType,JobStatus, IJob} from "shared/actions/jobs/JobTypes"

const log = getLogger(__filename)

export type TJobLogLevel = 'DEBUG'|'INFO'|'WARN'|'ERROR'

export enum JobLogLevel {
	DEBUG = 1,
	INFO,
	WARN,
	ERROR
}

export const JobLogLevelNames = [
	'DEBUG',
	'INFO',
	'WARN',
	'ERROR'
]

export interface IJobLog {
	level:TJobLogLevel
	message:string
	error:Error
	details:any[]
}

export interface IJobLogger {
	debug(message:string,error?:Error,...details:any[])
	info(message:string,error?:Error,...details:any[])
	warn(message:string,error?:Error,...details:any[])
	error(message:string,error?:Error,...details:any[])
}

/**
 * A formally scheduled job
 */
export interface IJobStatusDetail {

	
	id:string
	
	type:JobType
	
	progress?:number
	
	status:JobStatus

	error?:Error

	logs: IJobLog[]
}

/**
 * JobStateRecord, holds available properties
 *
 * @type {Immutable.Record.Class|any}
 */
export const JobStateRecord = Record({
	details:List<IJobStatusDetail>(),
	all:Map<string,IJob>(),
	error:null

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
			details: List(o.details)
		}))
	}
	
	all:Map<string,IJob>
	details:List<IJobStatusDetail>
	error:Error


}

