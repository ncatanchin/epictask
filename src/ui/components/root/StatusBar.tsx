
// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import {PureRender} from 'ui/components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import baseStyles from './StatusBar.styles'
import {jobsSelector, jobDetailsSelector} from "shared/actions/jobs/JobSelectors"
import {TJobMap, IJobStatusDetail} from "shared/actions/jobs/JobTypes"
import {IToastMessage} from "shared/models/Toast"
import {uiStateSelector} from "shared/actions/ui/UISelectors"
import {ToastMessage} from 'ui/components/ToastMessage'
import {JobItem} from "ui/plugins/jobs/JobItem"
import {UIActionFactory} from "shared/actions/ui/UIActionFactory"
import {BuiltInTools, getBuiltInToolId} from "shared/config/ToolConfig"

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
	open: (state) => uiStateSelector(state).statusBar.visible,
	messages: (state):IToastMessage[] => _.orderBy(
		uiStateSelector(state).messages.toArray().map(msg => _.toJS(msg)) || [],
		['createdAt'],
		['desc'])
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
	 * Render the complete status bar
	 */
	render() {
		const
			{
				jobs,
				open,
				details,
				messages,
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
				!open && styles.root.hidden
			]}>
			
			<div style={[styles.spacer]}></div>
			
			{message && <div style={[styles.status]}>
				<div style={[styles.status.item,styles.toast]}>
					<ToastMessage msg={message} styles={styles.toast}/>
				</div>
			</div>}
				
			
			{/* Job Status */}
			{detail && <div style={[styles.status]}>
				<JobItem onClick={() => Container.get(UIActionFactory)
									.toggleTool(getBuiltInToolId(BuiltInTools.JobMonitor))}
				         styles={{root:styles.status.item}}
				         job={job}
				         detail={detail} />
			</div>}
				
			
		</div>
	}
	
}