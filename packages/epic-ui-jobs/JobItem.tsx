// Imports

import filterProps from "react-valid-props"
import { PureRender, Icon,LinearProgress } from "epic-ui-components"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { IJobStatusDetail, IJob, JobStatus, getJobDescription } from "epic-typedux"


// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
	root: [
		CursorPointer,
		FillWidth,
		makeTransition(['height','width','flex-grow','flex-shrink','flex-basis']),
		FlexColumnCenter,
		Ellipsis,
		makePaddingRem(0,0.5),
		{
			minWidth: rem(24)
		}
	],
	
	// Job Description
	label: [
		makeTransition(['height','width','flex-grow','flex-shrink','flex-basis']),
		FlexRowCenter,
		FillWidth,{
			text: [Ellipsis,{
				flex: '1 1 auto'
			}],
			time: [FlexAuto,{
				fontStyle: 'italic',
				fontWeight: 300
			}],
			icon: [FlexAuto,makePaddingRem(0,1,0,0)],
			progress: [FlexAuto, {
				completed: {
					fontSize: rem(1.1),
				},
				paddingLeft: rem(1)
			}]
		}
	],
	
	// Job Progress Bar
	progressBar: [
		//makeTransition(['opacity','padding-right','padding-left','min-height','max-height','height','width','flex-grow','flex-shrink','flex-basis']),
		makeTransition(),
		OverflowHidden,
		makePaddingRem(0.3,0,0.3,0),
		{
			flexGrow: 1,
			flexShrink: 0,
			flexBasis: rem(5),
			minHeight: 'auto',
			maxHeight: 'auto',
			minWidth: rem(5),
			height: rem(0.4),
			opacity: 1,
			
			hidden: [makePaddingRem(),{
				minWidth: 0,
				flexGrow: 0,
				flexShrink: 0,
				flexBasis: 0,
				margin: 0,
				opacity: 0,
				height: 0,
				maxHeight: 0,
				minHeight: 0
			}]
		}
	]
	
})



/**
 * IJobItemProps
 */
export interface IJobItemProps extends IThemedAttributes {
	
	labelStyle?:any
	
	job:IJob
	detail:IJobStatusDetail
}


export function getJobStatusColors(detail:IJobStatusDetail,styles):any[] {
	return !detail ? [] : [
		detail.status === JobStatus.Completed && styles.success,
		detail.status === JobStatus.Failed && styles.failed
	]
}

/**
 * Get the correct icon name for the status
 *
 * @param detail
 * @returns {string}
 */
export function getJobStatusIcon(detail:IJobStatusDetail):string {
	return !detail ? '' : detail.status < JobStatus.Completed ?
		'play' :
		detail.status === JobStatus.Completed ?
			'check' :
			'exclamation-circle'
	
}

/**
 * JobItem
 *
 * @class JobItem
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobs.item')
@PureRender
export class JobItem extends React.Component<IJobItemProps,void> {
	
	render() {
		const
			{
				theme,
				styles,
				job,
				detail,
				labelStyle
			} = this.props,
			
			statusColors = getJobStatusColors(detail,styles)
		
		return !job || !detail ? React.DOM.noscript() : <div {...filterProps(this.props)} style={styles.root}>
		
			
			{/* Job Status */}
			<div style={[styles.label,labelStyle]}>
				
				{/*[{JobStatus[recentJob.status]}]&nbsp;*/}
				{/* Icon */}
				<div style={[styles.label.icon]}>
					
					<Icon
						style={[
							styles.label.icon,
							...statusColors
						]}
						iconSet="fa"
						iconName={getJobStatusIcon(detail)} />
					
				</div>
				
				{/* Text */}
				<div style={[styles.label.text]}>
					{/*{JobStatus[job.status]} - */}
					{getJobDescription(job)}
				</div>
				
				
				
				<div
					style={[
						styles.label.progress,
						styles.inProgress,
						job.status >= JobStatus.Completed && styles.label.progress.completed,
						job.status === JobStatus.Completed && styles.success,
						job.status === JobStatus.Failed && styles.failed,
					]}>
					{detail.status < JobStatus.Completed &&
						<div style={[
							styles.progressBar,
							
							// If the job is finished then hide the progress bar
							//detail.status >= JobStatus.Completed && styles.progressBar.hidden
						]}>
							<LinearProgress mode={detail.progress > 0 ? 'determinate' : 'indeterminate'}
							                value={Math.min(100,detail.progress * 100)}
							                color={theme.palette.accent1Color}
							/>
						</div>
					}
				</div>
				<div style={[styles.label.time]}>
					{Math.round(detail.progress * 100.0)}%
					{/*{!detail.epochETA ? 'N/A' : moment(detail.epochETA).fromNow()}*/}
				</div>
				
				{/*<TimeAgo timestamp={recentDetail.updatedAt} />*/}
			</div>
			
			
		</div>
	}
	
}