/**
 * Created by jglanz on 9/1/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector, createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {IJob, IJobStatusDetail, IJobLog, getJobDescription} from "shared/actions/jobs/JobTypes"
import {jobStateSelector} from "shared/actions/jobs/JobSelectors"
import {TimeAgo} from "ui/components/common/TimeAgo"
import {
	makePaddingRem, FlexRowCenter, FlexColumnCenter, FlexScale, FillHeight, FillWidth,
	FlexColumn, OverflowAuto
} from "shared/themes"
import {LinearProgress} from "material-ui"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumnCenter, FlexScale,FillHeight,FillWidth, {}],
	header: [FlexRowCenter,FillWidth,makePaddingRem(1,1,1,1)],
	logs: [FlexColumn,FlexScale,OverflowAuto,{
		
	}]
})


/**
 * IJobMonitorProps
 */
export interface IJobMonitorProps extends React.HTMLAttributes {
	theme?: any
	styles?: any
	job?: IJob
	detail?: IJobStatusDetail
	id:string
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
	job: (state,props) => jobStateSelector(state).all.get(props.id),
	detail:(state,props) => jobStateSelector(state).details.find(it => it.id === props.id)
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobMonitor')
@Radium
@PureRender
export class JobMonitor extends React.Component<IJobMonitorProps,IJobMonitorState> {
	
	render() {
		const
			{theme,styles,job,detail} = this.props,
			{logs,status} = detail
		
		const levelStyle = (log:IJobLog) =>
			styles.logs.levels[['WARN','ERROR'].includes(log.level) ? 'error' : 'DEBUG' === log.level ? 'success' : 'info']
		
		return <div style={styles.root}>
			
			{/* HEADER */}
			<div style={styles.header}>
				<div style={styles.header.description}>{getJobDescription(job)}</div>
				
				<LinearProgress mode={detail.progress > 0 ? 'determinate' : 'indeterminate'}
				                value={detail.progress * 100}
				                color={theme.palette.accent1Color}
				/>
				<div style={styles.header.progress}>{Math.ceil((Date.now() - detail.createdAt) / 1000)}s</div>
			</div>
			
			{/* LOGS */}
			<div style={styles.logs}>
				{logs && logs.map(log => <div style={[styles.logs.entry,levelStyle(log)]}>
					<div style={[styles.logs.entry.level]}>
						{log.level}
					</div>
					<div style={[styles.logs.entry.message]}>
						{log.message}
					</div>
					<div style={[styles.logs.entry.timestamp]}>
						<TimeAgo timestamp={log.timestamp}/>
					</div>
				</div>)}
			</div>
		</div>
	}
	
}