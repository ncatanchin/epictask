// Imports
import * as React from "react"
import { connect } from "react-redux"
import { PureRender } from "./PureRender"
import { createDeepEqualSelector, getValue } from "epic-common"
import { createStructuredSelector } from "reselect"
import { ThemedStyles } from "epic-styles"
import baseStyles from "./StatusBar.styles"
import {
	jobsSelector,
	jobDetailsSelector,
	TJobMap,
	IJobStatusDetail,
	getUIActions,
	messagesSortedSelector,
	statusBarHasItemsSelector
} from "epic-typedux"
import { INotificationMessage } from "epic-global"
import { ToastMessage } from "./ToastMessage"
import { JobItem } from "epic-plugins-default"
import { BuiltInTools, getBuiltInToolId } from "./tools"

// Constants
const
	log = getLogger(__filename)

/**
 * IStatusBarProps
 */
export interface IStatusBarProps extends React.HTMLAttributes<any> {
	theme?: any
	styles?: any
	open?:boolean
	autoHide?:boolean
	jobs?:TJobMap
	details?:IJobStatusDetail[]
	messages?:INotificationMessage[]
	hasItems?:boolean
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
	hasItems: statusBarHasItemsSelector,
	messages: messagesSortedSelector
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'statusBar')
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
	
	/**
	 * Whether the bar has items or not
	 *
	 * @returns {boolean}
	 */
	get hasItems() {
		return getValue(() => this.props.hasItems,false)
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
				hasItems,
				styles
			} = this.props,
			//inProgress = details.some(it => it.status < JobStatus.Completed),
			
			// Latest toast message
			message = messages[0],
			
			// Either get the first NON-completed job OR the last job updated (index=0)
			detail = details[0],
			job  = detail && jobs[detail.id]
		
			
		
		return <div
			key="statusBar"
			style={[
				styles.root,
				//inProgress && styles.root.inProgress,
				(!hasItems || !open) && styles.root.hidden
			]}>
			
			<div style={[styles.spacer]}></div>
			
			{message && <div style={[styles.status]}>
				<div style={[styles.status.item,styles.toast]}>
					<ToastMessage msg={message} styles={styles.toast}/>
				</div>
			</div>}
				
			
			{/* Job Status */}
			{detail && <div style={[styles.status]}>
				<JobItem onClick={() => getUIActions()
									.toggleTool(getBuiltInToolId(BuiltInTools.JobMonitor))}
				         styles={{root:styles.status.item}}
				         job={job}
				         detail={detail} />
			</div>}
				
			
		</div>
	}
	
}