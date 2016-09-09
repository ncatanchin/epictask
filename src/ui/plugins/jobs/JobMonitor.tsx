// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import {List} from 'immutable'
import {PureRender} from 'ui/components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {ThemedStyles, createThemedStyles} from 'shared/themes/ThemeManager'
import {IJobStatusDetail} from "shared/actions/jobs/JobTypes"
import {jobStateSelector, jobLogIdSelector} from "shared/actions/jobs/JobSelectors"
import {
	FlexColumnCenter, FlexScale, FillHeight, FillWidth,
	convertRem, FlexColumn
} from "shared/themes"
import * as SplitPane from 'react-split-pane'
import {TJobIMap, JobActionFactory} from "shared/actions/jobs/JobActionFactory"
import {JobList} from "./JobList"
import {JobDetail} from "./JobDetail"
import {RegisterTool} from "shared/Registry"
import {getBuiltInToolId, BuiltInTools} from "shared/Constants"
import {ToolPanelLocation, IToolProps} from "shared/tools/ToolTypes"
import {Button, Icon} from "ui/components"

// Constants
const log = getLogger(__filename)

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
export interface IJobMonitorProps extends IToolProps, React.HTMLAttributes {
	theme?: any
	styles?: any
	jobs?: TJobIMap
	details?: List<IJobStatusDetail>
	selectedId?:string
	selectedLogId?:string
}

/**
 * IJobMonitorState
 */
export interface IJobMonitorState {
	
}

function getHeaderControls() {
	const styles = createThemedStyles(baseStyles,['jobs'])
	return [
		<Button key="ClearJobsButton"
		        tabIndex={-1}
		        style={styles.header.button}
		        onClick={(event:React.MouseEvent) => {
							event.preventDefault()
							event.stopPropagation()
					
							log.debug(`add repo click`,event)
					
							Container.get(JobActionFactory).clear()
					
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

@RegisterTool({
	id: getBuiltInToolId(BuiltInTools.JobMonitor),
	label: 'Job Monitor',
	buttonLabel: 'Jobs',
	defaultLocation: ToolPanelLocation.Bottom,
	getHeaderControls
})
@connect(createStructuredSelector({
	jobs: (state) => jobStateSelector(state).all,
	details:(state) => jobStateSelector(state).details,
	selectedId:(state) => jobStateSelector(state).selectedId,
	selectedLogId: jobLogIdSelector,
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobs')
@PureRender
export class JobMonitor extends React.Component<IJobMonitorProps,IJobMonitorState> {
	
	render() {
		
		const
			{styles,jobs,details,selectedId,selectedLogId,panel} = this.props,
			splitOrientation = panel.location === ToolPanelLocation.Bottom ? 'vertical' : 'horizontal'
			
		
		
		return <div style={styles.root}>
			
			
			<SplitPane className="jobMonitorSplitPane"
			           minSize={convertRem(24)}
			           defaultSize="35%"
			           split={splitOrientation}>
				
				{/* List of all current Jobs */}
				<JobList jobs={jobs}
				         details={details}
				         selectedId={selectedId} />
				
				{/* Currently selected job details */}
				<JobDetail job={jobs.get(selectedId)}
				           detail={selectedId && details.find(it => it.id === selectedId)}
				           selectedLogId={selectedLogId}
				/>
				
			</SplitPane>
			
			
		</div>
	}
	
}