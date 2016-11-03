import { JobKey} from "epic-global/Constants"
import {createDeepEqualSelector } from 'epic-global/SelectorUtil'
import {TSelector} from 'epic-global/SelectorTypes'

import { JobState } from "../state/JobState"
import { IJob, TJobMap, IJobStatusDetail, IJobAndStatusDetail } from "../state/jobs"
import { uiStateSelector } from "epic-typedux/selectors/UISelectors"
import { createSelector } from "reselect"
import { UIState } from "epic-typedux/state/UIState"
import {List} from 'immutable'

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
export const jobsSelector:TSelector<TJobMap> = createSelector(
	jobStateSelector,
	(state:JobState) => state.all
)


/**
 * Selected job id
 */
export const selectedJobIdSelector:TSelector<string> = createSelector(
	uiStateSelector,
	(state:UIState) => state.jobs.selectedId
)


/**
 * Selected job log id
 *
 * @type {Reselect.Selector<TInput, string>}
 */
export const selectedJobLogIdSelector:TSelector<string> = createSelector(
	uiStateSelector,
	(state:UIState) => state.jobs.selectedLogId
)

/**
 * Get all job details
 */
export const jobDetailsSelector:TSelector<List<IJobStatusDetail>> = createDeepEqualSelector(
	jobStateSelector,
	(state:JobState) =>
		state.details.sortBy(it => moment(it.updatedAt).valueOf() * -1)
)

/**
 * Get all job details
 */
export const jobsAndStatusDetailsSelector:TSelector<List<IJobAndStatusDetail>> = createDeepEqualSelector(
	jobStateSelector,
	(state:JobState) => state
		.toArray()
		.map(detail => ({
			id: detail.id,
			job: state.all.get(detail.id),
			detail
		}))
)

