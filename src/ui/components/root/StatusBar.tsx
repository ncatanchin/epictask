
// Imports
import * as moment from 'moment'
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender, Icon} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector, createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import baseStyles,{IStatusBarStyles} from './StatusBar.styles'
import {jobsSelector, jobDetailsSelector} from "shared/actions/jobs/JobSelectors"
import {TJobMap, IJobStatusDetail, JobStatus, getJobDescription} from "shared/actions/jobs/JobTypes"
import {TimeAgo} from "ui/components/common/TimeAgo"
import {LinearProgress} from "material-ui"
import {IToastMessage} from "shared/models/Toast"
import {uiStateSelector} from "shared/actions/ui/UISelectors"
import {ToastMessage} from "components/ToastMessage"
import {UIActionFactory} from "shared/actions/ui/UIActionFactory"
import {JobMonitor} from "ui/components/root/JobMonitor"
import {openChildWindow} from "shared/util/WindowUtil"

// Constants
const log = getLogger(__filename)


/**
 * IStatusBarProps
 */
export interface IStatusBarProps extends React.HTMLAttributes {
	theme?: any
	styles?: any
	open?:boolean
	autoHide?:boolean
	jobs?:TJobMap
	details?:IJobStatusDetail[]
	messages?:IToastMessage[]
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
	details: jobDetailsSelector,
	messages: (state):IToastMessage[] => _.orderBy(
		uiStateSelector(state).messages.toArray().map(msg => _.toJS(msg)) || [],
		['createdAt'],
		['desc'])
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'statusBar')
@Radium
@PureRender
export class StatusBar extends React.Component<IStatusBarProps,IStatusBarState> {
	
	/**
	 * Prop defaults
	 *
	 * @type {{autoHide: boolean}}
	 */
	static defaultProps = {
		autoHide: false
	}
	
	makeOpenJobMonitor = job => event => {
		// const monitorWin = window.open()
		// log.info('Job monitor window',monitorWin)
		
		openChildWindow(`job-monitor-${job.id}`,<JobMonitor id={job.id}/>)
	}
	
	/**
	 * Render the complete status bar
	 */
	render() {
		const
			{
				jobs,
				open,
				details,
				messages,
				theme,
				styles
			} = this.props,
			//inProgress = details.some(it => it.status < JobStatus.Completed),
			
			// Latest toast message
			message = messages[0],
			
			// Either get the first NON-completed job OR the last job updated (index=0)
			detail = details[0],
			job  = detail && jobs[detail.id]
		
			
		
		return <div
			style={[
				styles.root,
				//inProgress && styles.root.inProgress,
				open && styles.root.open
			]}>
			
			<div style={[styles.spacer]}></div>
			
			{message && <div style={[styles.status]}>
				<div style={[styles.status.item,styles.toast]}>
					<ToastMessage msg={message} styles={styles.toast}/>
				</div>
			</div>}
				
			
			{/* Job Status */}
			{detail && <div style={[styles.status]}>
				<div
					style={[styles.status.item,styles.jobs.summary]}
				  onClick={this.makeOpenJobMonitor(job)}
				>
				
				{/* Job Status */}
				<div style={[styles.jobs.summary.label]}>
					
					{/*[{JobStatus[recentJob.status]}]&nbsp;*/}
					{/* Text */}
					<div style={[styles.jobs.summary.label.text]}>
						<Icon iconSet="fa" iconName="building"/>&nbsp;
						{JobStatus[job.status]} - {getJobDescription(job)}
					</div>
					
					<div style={[styles.jobs.summary.label.time]}>
						{Math.ceil((Date.now() - detail.createdAt) / 1000)}s
					</div>
					
					<div
						style={[
							styles.jobs.summary.label.progress,
							styles.jobs.summary.inProgress,
							job.status >= JobStatus.Completed && styles.jobs.summary.label.progress.completed,
							job.status === JobStatus.Completed && styles.jobs.summary.success,
							job.status === JobStatus.Failed && styles.jobs.summary.failed,
						]}>
						{detail.status < JobStatus.Completed ?
							// In-Progress
							<div style={[styles.jobs.summary.progressBar, detail.status >= JobStatus.Completed && styles.jobs.summary.progressBar.hidden]}>
								<LinearProgress mode={detail.progress > 0 ? 'determinate' : 'indeterminate'}
								                value={detail.progress * 100}
								                color={theme.palette.accent1Color}
								/>
							</div> : //`${Math.round(detail.progress * 100)}%` :
							
							// Completed / Failed
							<Icon
								style={[styles.jobs.summary.label.icon]}
								iconSet="fa"
								iconName={detail.status === JobStatus.Completed ? 'check' : 'exclamation-circle'} />
							 
						}
					</div>
					
					
					{/*<TimeAgo timestamp={recentDetail.updatedAt} />*/}
				</div>
				
				
				{/* If a description is available then show it */}
				{/*{recentJob.description && <div>{recentJob.description}</div>}*/}
				</div>
			</div>}
				
			
		</div>
	}
	
}