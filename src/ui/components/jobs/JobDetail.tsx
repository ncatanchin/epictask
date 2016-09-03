/**
 * Created by jglanz on 9/2/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {LinearProgress} from "material-ui"
import {getJobDescription, IJobStatusDetail, IJob, IJobLog} from "shared/actions/jobs/JobTypes"
import {TimeAgo} from "ui/components/common/TimeAgo"
import {FlexColumnCenter, FlexScale, makePaddingRem} from "shared/themes"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumnCenter, FillHeight, FillWidth, FlexScale, {}],
	header: [FlexRowCenter,FillWidth,makePaddingRem(1,1,1,1),{
		description: [Ellipsis,FlexScale],
		progress: [FlexScale,makePaddingRem(0,1.5),{
			flex: '0 0 25rem'
		}],
		time: [FlexAuto, {
			fontStyle: 'italic',
			fontWeight: 300
		}]
	}],
	logs: [FlexScale,FillWidth,OverflowAuto,{
		
		levels: [{
			warn: {
				fontWeight: 500
			},
			error: {
				fontWeight: 700,
				fontStyle: 'italic'
			}
		}],
		
		entry: [FlexRowCenter,FlexAuto,makeTransition('background-color'),{
			cursor: 'pointer',
			margin: '0 0.3rem',
			
			// Hovered style - applied to kids when hovering
			hovered: {
				transform: 'scale(1.1)'
			},
			
			level: [Ellipsis,makeTransition('transform'),{
				paddingLeft: rem(0.5),
				flex: '0 0 7rem'
				
			}],
			message: [FlexScale, makeTransition('transform'),makePaddingRem(1,1),{
				transformOrigin: 'left center'
			}],
			
			time: [Ellipsis,makeTransition('transform'),{
				width: rem(12),
				paddingRight: rem(0.5),
				fontWeight: 300,
				fontSize: rem(1.1),
				textAlign: 'right',
				transformOrigin: 'right center'
			}],
			
			divider: [{
				borderBottomWidth: rem(0.2),
				borderBottomStyle: 'solid'
			}]
		}]
	}]
})


/**
 * IJobDetailProps
 */
export interface IJobDetailProps extends React.HTMLAttributes {
	theme?:any
	styles?:any
}

/**
 * IJobDetailState
 */
export interface IJobDetailState {
	job?:IJob
	detail?:IJobStatusDetail
}

/**
 * JobDetail
 *
 * @class JobDetail
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobs')
@Radium
@PureRender
export class JobDetail extends React.Component<IJobDetailProps,IJobDetailState> {
	
	/**
	 * Render job details
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{theme, styles, job, detail} = this.props,
			logs = detail && detail.logs
		
		const levelStyle = (log:IJobLog) =>
			styles.logs.levels['WARN' === log.level ? 'warn' : 'ERROR' === log.level ? 'error' : 'DEBUG' === log.level ? 'success' : 'info']
		
		
		return <div style={styles.root}>
			
			{/* No Job Selected */}
			{!job && <div style={styles.root}>
				<div>Select a Job</div>
			</div>}
			
			{/* Job is selected */}
			{job && <div style={styles.root}>
				
				{/* HEADER */}
				<div style={styles.header}>
					<div style={styles.header.description}>{getJobDescription(job)}</div>
					
					<div style={styles.header.progress}>
						<LinearProgress mode={detail.progress > 0 ? 'determinate' : 'indeterminate'}
						                value={detail.progress * 100}
						                color={theme.palette.accent1Color}
						/>
					</div>
					<div style={styles.header.time}>
						{Math.ceil((Date.now() - detail.createdAt) / 1000)}s
					</div>
				</div>
				
				{/* LOGS */}
				<div style={styles.logs}>
					
					{logs && logs.map((log,index) => {
						const
							errorStyle = log.level === 'ERROR' && levelStyle(log),
							hoverStyle = Radium.getState(this.state,log.id,':hover') && styles.logs.entry.hovered
						
						//Log Entry Row
						return <div key={log.id} style={[
							styles.logs.entry,
							// If not last entry then add divider border
							index < logs.size - 1 && styles.logs.entry.divider
						]}>
							<div style={[styles.logs.entry.level,hoverStyle,levelStyle(log)]}>
								{log.level}
							</div>
							<div style={[styles.logs.entry.message,hoverStyle,errorStyle]}>
								{log.message}
							</div>
							<div style={[styles.logs.entry.time,errorStyle]}>
								<TimeAgo timestamp={log.timestamp}/>
							</div>
						</div>
					})}
				</div>
			</div>}
		</div>
	}
	
}