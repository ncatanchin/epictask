
// Imports
import * as moment from 'moment'
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector, createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import baseStyles,{IStatusBarStyles} from './StatusBar.styles'
import {jobsSelector, jobDetailsSelector} from "shared/actions/jobs/JobSelectors"
import {TJobMap, IJobStatusDetail, JobStatus} from "shared/actions/jobs/JobTypes"
import {TimeAgo} from "ui/components/common/TimeAgo"

// Constants
const log = getLogger(__filename)


/**
 * IStatusBarProps
 */
export interface IStatusBarProps extends React.HTMLAttributes {
	theme?: any
	styles?: IStatusBarStyles
	open?:boolean
	autoHide?:boolean
	jobs?:TJobMap
	details?:IJobStatusDetail[]
}

/**
 * IStatusBarState
 */
export interface IStatusBarState {
	
}

/**
 * StatusBar
 *
 * @class StatusBar
 * @constructor
 **/

@connect(createStructuredSelector({
	jobs: jobsSelector,
	details: jobDetailsSelector
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'statusBar')
@Radium
@PureRender
export class StatusBar extends React.Component<IStatusBarProps,IStatusBarState> {
	
	static defaultProps = {
		autoHide: false
	}
	
	render() {
		const
			{
				jobs,
				open,
				details,
				theme,
				styles
			} = this.props,
			inProgress = details.some(detail => detail.status < JobStatus.Completed),
			
			// Either get the first NON-completed job OR the last job updated (index=0)
			recentDetail = details.length && (details.find(it => it.status < JobStatus.Completed) || details[0]),
			recentJob = recentDetail && jobs[recentDetail.id]
		
			
		
		return <div
			style={[
				styles.root,
				inProgress && styles.root.inProgress,
				open && styles.root.open
			]}>
			
			<div style={[styles.spacer]}></div>
			
			{/* Job Status */}
			{recentDetail && <div style={[styles.jobs.summary]}>
				
				{/* Job Status */}
				<div>
					[{JobStatus[recentJob.status]}]&nbsp;
					{recentJob.name}&nbsp;
					<TimeAgo timestamp={recentDetail.updatedAt} />
				</div>
				
				{/* If a description is available then show it */}
				{recentJob.description && <div>{recentJob.description}</div>}
			</div>}
				
			
		</div>
	}
	
}