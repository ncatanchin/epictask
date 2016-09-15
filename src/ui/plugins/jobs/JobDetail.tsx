
// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {PureRender} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {LinearProgress} from "material-ui"

import {JobActionFactory, TJobIMap} from 'shared/actions/jobs/JobActionFactory'
import {getJobDescription, IJobStatusDetail, IJob, IJobLog, JobStatus} from "shared/actions/jobs/JobTypes"
import {TimeAgo} from "ui/components/common/TimeAgo"
import {
	FlexColumnCenter, FlexScale, makePaddingRem, rem, FillHeight, createStyles, FillWidth,
	FlexRowCenter, Ellipsis
} from "shared/themes"

import {getJobStatusColors} from "ui/plugins/jobs/JobItem"
import { LogWatcher, LogWatcherEvent } from "shared/util/LogWatcher"
import { IEnumEventRemover } from "shared/util/EnumEventEmitter"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumnCenter, FillHeight, FillWidth, FlexScale, {
		hasJobs: {
			borderLeftStyle: 'solid',
			borderLeftWidth: rem(0.1)
		}
	}],
	header: [FlexRowCenter,FillWidth,makePaddingRem(1,1,1,1),{
		status: [makePaddingRem(0,0,0,1),{
			fontWeight:500,
			textTransform: 'uppercase'
		}],
		description: [Ellipsis,FlexScale],
		progress: [FlexScale,makePaddingRem(0,1.5),{
			flex: '0 0 25rem'
		}],
		time: [FlexAuto, {
			fontStyle: 'italic',
			fontWeight: 300
		}],
		icon: [FlexAuto,makePaddingRem(0,1,0,1)]
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
		
		entry: [FlexColumn,FlexAuto,makeTransition('background-color'),{
			cursor: 'pointer',
			
			
			row: [
				FlexRowCenter,
				FlexAuto,
				OverflowHidden,
				makeTransition(['background-color','height','max-height','min-height','flex-basis','flex-grow','flex-shrink']),
				{
					margin: '0 0.3rem',
					flexGrow: 0,
					flexShrink: 0,
					flexBasis: 'auto',
					hidden: [{
						flexBasis: 0
					}]
				}
			],
			
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
			
			details: [FlexScale,{overflowX: 'auto'}],
			
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
export interface IJobDetailProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	job:IJob
	jobs?: TJobIMap
	detail:IJobStatusDetail
	selectedLogId:string
}

export interface IJobDetailState {
	watcher?:LogWatcher
	watcherEventRemovers:IEnumEventRemover[]
}


/**
 * JobDetail
 *
 * @class JobDetail
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'jobs','jobs.item','jobs.detail')
@PureRender
export class JobDetail extends React.Component<IJobDetailProps,IJobDetailState> {
	
	constructor (props,context) {
		super(props,context)
	
	}

	
	get watcher():LogWatcher {
		return _.get(this,'state.watcher',null)
	}
	
	get watcherEventRemovers():IEnumEventRemover[] {
		return _.get(this,'state.watcherEventRemovers',null)
	}
	
	
	/**
	 * Update the job detail component state
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		if (ProcessConfig.isStorybook())
			return
		
		let
			watcher:LogWatcher = this.watcher,
			{job,detail} = props,
			jobFilename:string = _.get(job,'logJSONFilename',null)
			
		
		if (watcher && watcher.filename === jobFilename) {
			log.info(`Job changed, closing previous watcher`)
			return
		}
		
		if (watcher && watcher.filename !== jobFilename) {
			watcher.stop()
		}
	
	
		
		if (!job || !detail) {
			log.info(`No job or detail - cant start tailing yet`, job,detail)
			return
		}
		
		watcher = LogWatcher.getInstance(job.logJSONFilename,true)
		log.info(`Got watcher`,watcher)
		this.setState({
			watcher,
			watcherEventRemovers: watcher.addAllListener((event:LogWatcherEvent,watcher:LogWatcher,...args) => {
				log.info(`Received watcher event ${LogWatcherEvent[event]}`,watcher,...args)
			})
		},() => {
			log.info(`State set, starting log watcher for ${watcher.filename}`)
			watcher.start()
		})
	}
	
	componentWillMount() {
		this.updateState()
	}
	
	componentWillReceiveProps(nextProps) {
		this.updateState(nextProps)
	}

	
	componentWillUnmount() {
		const {watcher,watcherEventRemovers} = this
		
		if (watcher) {
			log.info(`Stopping watcher`,watcher)
			watcher.stop()
		}
		
		if (watcherEventRemovers) {
			log.info(`Removing all listeners`)
			watcherEventRemovers.forEach(it => it())
		}
	}
	
	/**
	 * Render job details
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{theme, styles, job, jobs,detail,selectedLogId} = this.props,
			watcher:LogWatcher = _.get(this,'state.watcher',null),
			logs = watcher && watcher.allJsons,//detail && detail.logs,
			statusColors = getJobStatusColors(detail,styles)
		
		const levelStyle = (log:IJobLog) =>
			styles.logs.levels['WARN' === log.level ? 'warn' : 'ERROR' === log.level ? 'error' : 'DEBUG' === log.level ? 'success' : 'info']
		
		
		return <div style={[styles.root, jobs && jobs.size && styles.root.hasJobs ]}>
			
			{/* No Job Selected */}
			{!job && <div style={styles.root}>
				<div>Select a Job</div>
			</div>}
			
			{/* Job is selected */}
			{job && <div style={styles.root}>
				
				{/* HEADER */}
				<div style={[styles.header]}>
					
					{/*<Icon*/}
						{/*style={[*/}
								{/*styles.header.icon,*/}
								{/*...statusColors*/}
							{/*]}*/}
						{/*iconSet="fa"*/}
						{/*iconName={getJobStatusIcon(detail)} />*/}
					
					<div style={styles.header.description}>{getJobDescription(job)}</div>
				
					{detail.status < JobStatus.Completed &&
						<div style={styles.header.progress}>
							<LinearProgress mode={detail.progress > 0 ? 'determinate' : 'indeterminate'}
							                value={Math.min(100,detail.progress * 100)}
							                color={theme.palette.accent1Color}
							/>
						</div>
						
						
						
					}
						
					
					<div style={styles.header.time}>
						{Math.ceil((Date.now() - detail.createdAt) / 1000)}s
					</div>
					<div style={[styles.header.status,...statusColors]}>
						{JobStatus[job.status]}
					</div>
					
					
				</div>
				
				{/* LOGS */}
				<div style={styles.logs}>
					
					{logs && logs.map((log:IJobLog,index) => { //_.uniqBy(logs,'id').map((log:IJobLog,index) => {
						const
							isError = log.level === 'ERROR',
							errorDetails = log.errorDetails,
							errorStyle = isError && levelStyle(log),
							logKey = log.id,
							selected = selectedLogId === log.id,
							hoverStyle =
								(selected || Radium.getState(this.state,logKey,':hover')) &&
								styles.logs.entry.hovered
							
						
						
						//Log Entry Row
						return <div key={logKey}
						            onClick={() => !selected && Container.get(JobActionFactory).setSelectedLogId(log.id)}
						            style={[
													styles.logs.entry,
													index < logs.size - 1 && styles.logs.entry.divider
												]}>
							<div style={[styles.logs.entry.row]}>
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
							
							{/* Error stack details */}
							{isError && errorDetails && <div style={[styles.logs.entry.row, !selected && styles.logs.entry.row.hidden ]}>
								<div style={[styles.logs.entry.level]}>
									{/* Empty spacing place holder */}
								</div>
								<pre style={[styles.logs.entry.details]}>
									<div>Error details: </div>
									<div>{errorDetails.message}</div>
									<div>{errorDetails.stack}</div>
									{/*{errorDetails.stack.map(frame => <div>*/}
										{/*<span>*/}
											{/*<span>{frame.functionName}</span>*/}
											{/*at*/}
											{/*<span>{frame.fileName}</span>*/}
											{/*:(*/}
											{/*<span>{frame.lineNumber}</span>:*/}
											{/*<span>{frame.columnNumber}</span>*/}
											{/*)*/}
										{/*</span>*/}
									{/*</div>)}*/}
								</pre>
							</div>}
						</div>
					})}
				</div>
			</div>}
		</div>
	}
	
}