/**
 * Created by jglanz on 9/1/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {List} from 'immutable'
import {PureRender} from 'ui/components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {IJobStatusDetail} from "shared/actions/jobs/JobTypes"
import {jobStateSelector, jobLogIdSelector} from "shared/actions/jobs/JobSelectors"
import {
	FlexColumnCenter, FlexScale, FillHeight, FillWidth,
	convertRem
} from "shared/themes"
import * as SplitPane from 'react-split-pane'
import {LinearProgress} from "material-ui"
import {TJobIMap} from "shared/actions/jobs/JobActionFactory"
import {JobList} from "ui/components/jobs/JobList"
import {JobDetail} from "ui/components/jobs/JobDetail"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumnCenter, FlexScale,FillHeight,FillWidth, {}]
	
})



/**
 * IJobMonitorProps
 */
export interface IJobMonitorProps extends React.HTMLAttributes {
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

/**
 * JobMonitor
 *
 * @class JobMonitor
 * @constructor
 **/

@connect(createStructuredSelector({
	jobs: (state) => jobStateSelector(state).all,
	details:(state) => jobStateSelector(state).details,
	selectedId:(state) => jobStateSelector(state).selectedId,
	selectedLogId: jobLogIdSelector,
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobs')
@Radium
@PureRender
export class JobMonitor extends React.Component<IJobMonitorProps,IJobMonitorState> {
	
	render() {
		const
			{styles,jobs,details,selectedId,selectedLogId} = this.props
			
		
		
		return <div style={styles.root}>
			
			
			<SplitPane className="jobMonitorSplitPane"
			           minSize={convertRem(24)}
			           defaultSize="35%"
			           split="vertical">
				
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