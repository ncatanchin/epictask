// Imports

import { connect } from "react-redux"
import { List } from "immutable"
import { getBuiltInToolId, BuiltInTools } from "epic-ui-components/tools/ToolConfig"
import { PureRender, Button, Icon } from "epic-ui-components/common"

import { createStructuredSelector } from "reselect"
import { ThemedStyles, createThemedStyles, FlexScale, FlexColumn } from "epic-styles"
import { IJobStatusDetail, TJobIMap} from "epic-typedux/state/jobs"
import { JobList } from "./JobList"
import { JobDetail } from "./JobDetail"

import { jobsSelector, jobDetailsSelector} from "epic-typedux/selectors/JobSelectors"

import JobMonitorController from "./JobMonitorController"
import { getJobActions } from "epic-typedux/provider/ActionFactoryProvider"

// Constants
const
	log = getLogger(__filename),
	SplitPane = require('react-split-pane')

//region STYLES
const baseStyles = createStyles({
	root: [FlexColumn, FlexScale, {}],
	header: [{
		button: [FlexRowCenter,{
			height: rem(2),
			borderRadius: 0,
			
			label: {
				fontSize: rem(0.9),
				padding: '0 0.5rem 0 0'
			},
			
			icon: {
				fontSize: rem(1)
			},
		}]
	}]
	
})
//endregion

/**
 * IJobMonitorProps
 */
export interface IJobMonitorProps extends IToolProps, React.HTMLAttributes<any> {
	theme?: any
	styles?: any
	jobs?: TJobIMap
	details?: List<IJobStatusDetail>
	
}

/**
 * IJobMonitorState
 */
export interface IJobMonitorState {
	selectedId?:string
	selectedLogId?:string
	controller?:JobMonitorController
}

function getHeaderControls() {
	const styles = createThemedStyles(baseStyles,['jobs'])
	return [
		<Button key="ClearJobsButton"
		        tabIndex={-1}
		        style={styles.header.button}
		        onClick={(event:React.MouseEvent<any>) => {
							event.preventDefault()
							event.stopPropagation()
					
							log.debug(`add repo click`,event)
					
							getJobActions().clear()
					
						}}>
			<Icon style={styles.header.button.icon} iconSet='fa' iconName='times'/>
		</Button>
	]
}

/**
 * JobMonitor
 *
 * @class JobMonitor
 * @constructor
 **/

@ToolRegistryScope.Register({
	id: getBuiltInToolId(BuiltInTools.JobMonitor),
	label: 'Job Monitor',
	buttonLabel: 'Jobs',
	defaultLocation: ToolPanelLocation.Bottom,
	getHeaderControls
})
@connect(createStructuredSelector({
	jobs: jobsSelector,
	details: jobDetailsSelector
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobs')
@PureRender
export class JobMonitor extends React.Component<IJobMonitorProps,IJobMonitorState> {
	
	static childContextTypes = {
		monitorController: React.PropTypes.object
	}
	
	/**
	 * Get child context
	 *
	 * @returns {{monitorController: (any|string|null)}}
	 */
	getChildContext() {
		return {
			monitorController: this.state.controller
		}
	}
	
	/**
	 * Create Job Monitor
	 *
	 * @param props
	 * @param context
	 */
	constructor(props,context) {
		super(props,context)
		
		const
			controller = new JobMonitorController()
		
		
		this.state = {
			controller
		}
		
		controller.addListener((selectedId:string,selectedLogId:string) => this.setState({
			selectedId,
			selectedLogId
		}))
	}
	
	
	
	render() {
		
		const
			{styles,jobs,details,panel} = this.props,
			
			{selectedId,selectedLogId} = this.state,
			
			splitOrientation = panel.location === ToolPanelLocation.Bottom ? 'vertical' : 'horizontal',
			
			jobCount = jobs ? jobs.size : 0
			
		
		return <div style={styles.root}>
			
			
			<SplitPane className="jobMonitorSplitPane"
			           minSize={!jobCount ? 0 : '15%'}
			           defaultSize={!jobCount ? 0 : '25%'}
			           maxSize={!jobCount ? 0 : '50%'}
			           split={splitOrientation}>
				
				{/* List of all current Jobs */}
				<JobList jobs={jobs}
				         details={details}
				         selectedId={selectedId} />
				
				{/* Currently selected job details */}
				<JobDetail job={jobs.get(selectedId)}
				           jobs={jobs}
				           detail={selectedId && details.find(it => it.id === selectedId)}
				           selectedLogId={selectedLogId}
				/>
				
			</SplitPane>
			
			
		</div>
	}
	
}

if (module.hot) {
	log.info(`Setting up hmr`)
	module.hot.dispose(() => log.info(`Disposing`))
	module.hot.accept(() => log.info(`HMR Update`))
}
