// Imports
import { PureRender } from 'epic-ui-components/common'
import { ThemedStyles } from 'epic-styles'
import { IThemedAttributes } from "epic-styles/ThemeDecorations"
import { IVisibleListRowComponent, IRowState } from "epic-ui-components/common/VisibleList"
import { IJobLog } from "epic-typedux/state/jobs/JobTypes"
import { getValue } from "typeguard"
import JobMonitorController from "epic-plugins-default/jobs/JobMonitorController"
import { TimeAgo } from "epic-ui-components/common/TimeAgo"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexColumn, FlexAuto, {} ]
}


/**
 * IJobLogRowProps
 */
export interface IJobLogRowProps extends IThemedAttributes {
	
}

/**
 * IJobLogRowState
 */
export interface IJobLogRowState {
	rowState?:IRowState<any,string,IJobLog>
}

/**
 * JobLogRow
 *
 * @class JobLogRow
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class JobLogRow extends React.Component<IJobLogRowProps,IJobLogRowState> implements IVisibleListRowComponent<any,string,IJobLog> {
	
	static contextTypes = {
		monitorController:React.PropTypes.object
	}
	
	/**
	 * Get job monitor from context typed
	 *
	 * @returns {JobMonitor}
	 */
	private get controller() {
		return getValue(() => (this.context as any).monitorController) as JobMonitorController
	}
	
	
	setRowState(rowState:IRowState<any,string,IJobLog>) {
		this.setState({
			rowState
		})
	}
	
	getRowState() {
		return getValue(() => this.state.rowState)
	}
	/**
	 * Get log level style
	 *
	 * @param logItem
	 */
	private levelStyle = (logItem:IJobLog) =>
		this.props.styles.logs.levels['WARN' === logItem.level ? 'warn' : 'ERROR' === logItem.level ? 'error' : 'DEBUG' === logItem.level ? 'success' : 'info']
	
	
	
	render() {
		
		const
			{styles} = this.props,
			rowState = getValue(() => this.state.rowState)
		
		if (!rowState)
			return React.DOM.noscript()
		
		const
			selectedLogId = getValue(() => this.controller.selectedLogId),
			{items,index,key} = rowState,
			
			logItem = items.get(index),
			isError = logItem.level === 'ERROR',
			errorDetails = logItem.errorDetails,
			errorStyle = isError && this.levelStyle(logItem),
			logKey = logItem.id,
			selected = selectedLogId === logItem.id,
			hoverStyle =
				(selected || Radium.getState(this.state,logKey,':hover')) &&
				styles.logs.entry.hovered
		
		
		return <div key={key}
		            onClick={() => !selected && this.controller.setSelectedLogId(logItem.id)}
		            style={[
									styles.logs.entry,
									index < items.size - 1 &&
										styles.logs.entry.divider
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
	
}