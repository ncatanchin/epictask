
// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {ThemedStyles} from "epic-styles"
import {LinearProgress} from "material-ui"

import {JobActionFactory, TJobIMap} from "epic-typedux"
import {getJobDescription, IJobStatusDetail, IJob, IJobLog, JobStatus} from "epic-typedux"
import {TimeAgo} from "epic-ui-components"
import {
	FlexColumnCenter, FlexScale, makePaddingRem, rem, FillHeight, createStyles, FillWidth,
	FlexRowCenter, Ellipsis, FlexColumn
} from "epic-styles"

import {getJobStatusColors} from "./JobItem"
import { LogWatcher, LogWatcherEvent } from  "epic-common"
import { IEnumEventRemover } from  "epic-common"
import { getValue, shallowEquals } from  "epic-common"
import { VisibleList } from "epic-ui-components"

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
	logs: [FlexScale,FlexColumn,FillWidth,OverflowHidden,{
		
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
	watcherEventRemovers?:IEnumEventRemover[]
	lineCount?:number
	allLogs?:IJobLog[]
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
export class JobDetail extends React.Component<IJobDetailProps,IJobDetailState> {
	
	/**
	 * Get the current watcher
	 *
	 * @returns {LogWatcher}
	 */
	private get watcher():LogWatcher {
		return getValue(() => this.state.watcher,null)
	}
	
	/**
	 * Get event removers
	 *
	 * @returns {IEnumEventRemover[]}
	 */
	private get watcherEventRemovers():IEnumEventRemover[] {
		return getValue(() => this.state.watcherEventRemovers,null)
	}
	
	/**
	 * Debounced event handler
	 */
	private onWatcherEvent = _.debounce((event:LogWatcherEvent,watcher:LogWatcher,...args) => {
		log.debug(`Received watcher event ${LogWatcherEvent[event]}`,watcher,...args)
		
		if (watcher.lineCount !== getValue(() => this.state.lineCount,0)) {
			this.setState({
				lineCount: watcher.lineCount,
				allLogs: watcher.allJsons
			})
		}
	},1000, {
		maxWait: 2000
	})
	
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
			jobFilename = getValue(() => job.logJSONFilename,null)
			
		// IF FILENAME HAS NOT CHANGED THEN RETURN
		if (watcher && watcher.filename === jobFilename) {
			log.debug(`Job changed, closing previous watcher`)
			return
		}
		
		// IF IT HAS CHANGED THEN STOP THE OLD ONE
		if (watcher && watcher.filename !== jobFilename) {
			watcher.stop()
		}
		
		
		if (!job || !detail) {
			log.debug(`No job or detail - cant start tailing yet`, job,detail)
			return
		}
		
		// GET THE WATCHER
		watcher = LogWatcher.getInstance(job.logJSONFilename,true)
		watcher.start()
		
		log.debug(`Got watcher`,watcher)
		this.setState({
			lineCount: watcher.lineCount,
			allLogs: watcher.allJsons,
			watcher,
			watcherEventRemovers: watcher.addAllListener(this.onWatcherEvent)
		})
	}
	
	/**
	 * On mount create the watcher
	 */
	componentWillMount = this.updateState
	
	/**
	 * On update - check the watcher
	 */
	componentWillReceiveProps = this.updateState
	
	/**
	 * On unmount clear everything
	 */
	componentWillUnmount() {
		const
			{watcher,watcherEventRemovers} = this
		
		if (watcher) {
			log.debug(`Stopping watcher`)
			watcher.stop()
		}
		
		if (watcherEventRemovers) {
			log.debug(`Removing all listeners`)
			watcherEventRemovers.forEach(it => it())
		}
		
		this.setState({
			watcher:null,
			watcherEventRemovers:null,
			lineCount: 0,
			allLogs: []
		})
	}
	
	/**
	 * Only update when log file, selection or log line counts change
	 *
	 * @param nextProps
	 * @param nextState
	 * @param nextContext
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps:IJobDetailProps, nextState:IJobDetailState, nextContext:any):boolean {
		return !shallowEquals(this.props,nextProps,'job.logJSONFilename','selectedLogId') ||
				!shallowEquals(this.state,nextState,'lineCount','allLogs')
	}
	
	/**
	 * Get log level style
	 *
	 * @param logItem
	 */
	private levelStyle = (logItem:IJobLog) =>
		this.props.styles.logs.levels['WARN' === logItem.level ? 'warn' : 'ERROR' === logItem.level ? 'error' : 'DEBUG' === logItem.level ? 'success' : 'info']
	
	
	/**
	 * Render a log item
	 *
	 * @param logItems
	 * @param index
	 * @param style
	 * @param key
	 * @returns {any}
	 */
	private renderLogItem = (logItems:IJobLog[],index:number,style,key) => {
		const
			{styles, selectedLogId} = this.props,
			logItem = logItems[index],
			isError = logItem.level === 'ERROR',
			errorDetails = logItem.errorDetails,
			errorStyle = isError && this.levelStyle(logItem),
			logKey = logItem.id,
			selected = selectedLogId === logItem.id,
			hoverStyle =
				(selected || Radium.getState(this.state,logKey,':hover')) &&
				styles.logs.entry.hovered
		
		
		
		//Log Entry Row
		return <div key={key}
		            onClick={() => !selected && Container.get(JobActionFactory).setSelectedLogId(logItem.id)}
		            style={[
													styles.logs.entry,
													index < logItems.size - 1 && styles.logs.entry.divider
												]}>
			<div style={[styles.logs.entry.row]}>
				<div style={[styles.logs.entry.level,hoverStyle,this.levelStyle(logItem)]}>
					{logItem.level}
				</div>
				<div style={[styles.logs.entry.message,hoverStyle,errorStyle]}>
					{logItem.message}
				</div>
				<div style={[styles.logs.entry.time,errorStyle]}>
					<TimeAgo timestamp={logItem.timestamp}/>
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
				</pre>
			</div>}
		</div>
		
	}
	
	/**
	 * Render job details
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{theme, styles, job, jobs,detail} = this.props,
			allLogs = getValue(() => this.state.allLogs,[]),
			lineCount = getValue(() => this.state.lineCount,0),
			statusColors = getJobStatusColors(detail,styles)
		
		
		
		return <div style={[styles.root, jobs && jobs.size && styles.root.hasJobs ]}>
			
			{/* No Job Selected */}
			{!job && <div style={styles.root}>
				<div>Select a Job</div>
			</div>}
			
			{/* Job is selected */}
			{job && <div style={styles.root}>
				
				{/* HEADER */}
				<div style={[styles.header]}>
					
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
					<VisibleList
						itemCount={lineCount}
					  items={allLogs || []}
					  itemRenderer={this.renderLogItem}
					  itemKeyFn={(logItems,logItem,index) => `${job.id}-${index}`}
					/>
					
				</div>
			</div>}
		</div>
	}
	
}