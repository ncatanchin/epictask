import {JobKey} from "epic-global"

import {createDeepEqualSelector} from  "epic-global"

import {JobState } from "../state/JobState"
import {IJob, TJobMap, IJobStatusDetail,IJobAndStatusDetail} from "../state/jobs"
import {TSelector, TRootState} from "epic-global"


/**
 * Get the current job state
 *
 * @param state
 * @return {JobState}
 *
 */
export const jobStateSelector:TSelector<JobState> =
	(state):JobState => state.get(JobKey) as JobState


/**
 * Get all jobs
 */
export const jobSelector:TSelector<TJobMap> = createDeepEqualSelector(
	(state:TRootState,props) => jobStateSelector(state).all.get(props.jobId),
	(job:IJob) => job
)

/**
 * Get all jobs
 */
export const jobsSelector:TSelector<{[id:string]:IJob}> = createDeepEqualSelector(
	jobStateSelector,
	(state:JobState) => state.all.toJS()
)

export const jobLogIdSelector:TSelector<string> = _.memoize(
	(state) => jobStateSelector(state).selectedLogId
)

/**
 * Get all job details
 */
export const jobDetailsSelector:TSelector<IJobStatusDetail[]> = createDeepEqualSelector(
	jobStateSelector,
	(state:JobState) =>
		_.orderBy(state.details.toArray(),['updatedAt'],['desc'])
)

/**
 * Get all job details
 */
export const jobsAndStatusDetailsSelector:TSelector<IJobAndStatusDetail[]> = createDeepEqualSelector(
	jobStateSelector,
	(state:JobState) => state
		.details
		.toArray()
		.map(detail => ({
			id: detail.id,
			job: state.all.get(detail.id),
			detail
		}))
)

