// Imports

import { connect } from "react-redux"
import { PureRender, ToastMessage } from "epic-ui-components"
import { createDeepEqualSelector, getValue} from "epic-global"
import { createStructuredSelector,createSelector } from "reselect"
import { ThemedStyles } from "epic-styles"
import baseStyles from "./StatusBar.styles"
import {
	jobsSelector,
	jobDetailsSelector,
	TJobMap,
	IJobStatusDetail,
	getUIActions
} from "epic-typedux"

import { messagesSortedSelector } from "epic-typedux/selectors"

// Constants
const
	log = getLogger(__filename)

const statusBarHasItemsSelector:(state) => boolean = createSelector(
	messagesSortedSelector,
	jobsSelector,
	(messages,jobs) =>
		getValue(() =>
			Object.keys(jobs).length,0) + getValue(() => messages.size) > 0
)


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
	messages?:INotification[]
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
				
			
			{
				//TODO: REIMPLEMENT STATUS BAR WITH REGISTRY
				/* Job Status*/
			}
			{/*{detail && <div style={[styles.status]}>*/}
				{/*<JobItem onClick={() => getUIActions()*/}
									{/*.toggleTool(getBuiltInToolId(BuiltInTools.JobMonitor))}*/}
				         {/*styles={{root:styles.status.item}}*/}
				         {/*job={job}*/}
				         {/*detail={detail} />*/}
			{/*</div>}*/}
				
			
		</div>
	}
	
}