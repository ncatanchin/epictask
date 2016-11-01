
import { JobType, IJob, JobStatus, IJobStatusDetail, JobLogLevel, TJobLogLevel } from "../jobs/JobTypes"
import { uuid } from  "epic-global"
import { JobActionFactory } from "../../actions/JobActionFactory"
import { tempFilename } from  "epic-global"



const log = getLogger(__filename)



export namespace JobDAO {
	
	
	function makeErrorDetails(error:Error) {
		let frames = []
		
		return {
			message: error.message,
			frames,
			stack: (() => {
				try {
					return error.stack
				} catch (err) {
					log.warn(`Unable to get stack trace`, err)
					return "Unable to get stack trace"
				}
			})()
		}
	}
	
	
	
	
	/**
	 * Create a new job
	 *
	 * @param type
	 * @param description
	 * @param args
	 * @returns {(jobState:JobState)=>Map<string, Map<string, IJob>>}
	 */
	
	
	export function create(type:JobType,
	                       description:string = JobType[type],
	                       args:any = {}) {
		
		
		// Create Job
		const
			id = uuid(),
			logBaseFilename = `job-${JobType[type]}-${id}`,
			job:IJob = {
				id,
				type,
				logFilename: tempFilename(logBaseFilename,'log'),
				logJSONFilename: tempFilename(logBaseFilename,'json.log'),
				status: JobStatus.Created,
				name: JobType[type],
				description,
				args
			}
			
		// Create details
		const
			detail = assign(_.pick(job, 'id', 'status', 'type'), {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				progress: 0,
				logs: []
			}) as IJobStatusDetail
		
		new JobActionFactory().update(job, detail)
		
		return {job, detail}
		
		
	}
	
	
	/**
	 * Add a log record to job status detail
	 *
	 * @param jobId
	 * @param id - unique log id
	 * @param level
	 * @param message
	 * @param timestamp
	 * @param error
	 * @param details
	 */
	
	// export function logRecord(jobId:string, id:string, level:JobLogLevel, message:string, timestamp:number, error:Error = null, ...details:any[]) {
	// 	let errorDetails = null
	// 	if (error) {
	// 		errorDetails = makeErrorDetails(error)
	// 	}
	//
	//
	//
	// 	// getJobActions().addLog(jobId,{
	// 	// 	id,
	// 	// 	level: JobLogLevel[level] as TJobLogLevel,
	// 	// 	message,
	// 	// 	timestamp,
	// 	// 	error,
	// 	// 	errorDetails,
	// 	// 	details
	// 	// })
	// }
}




export default JobDAO