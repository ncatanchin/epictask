// Imports
import { PureRender } from 'epic-ui-components/common'
import { ThemedStyles } from 'epic-styles'
import { IThemedAttributes } from "epic-styles/ThemeDecorations"
import { IVisibleListRowComponent, IRowState } from "epic-ui-components/common/VisibleList"
import { IJobLog } from "epic-typedux/state/jobs/JobTypes"
import { getValue } from "typeguard"
import JobMonitorController from "epic-plugins-default/jobs/JobMonitorController"
import { TimeAgo } from "epic-ui-components/common/TimeAgo"
import { isHovering } from "epic-styles/styles"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexColumn, FlexAuto, {
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
			
			':hover': {
				backgroundColor: primary.hue1,
			},
		
			
			
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
				color: text.secondary,
				width: rem(12),
				paddingRight: rem(0.5),
				fontWeight: 300,
				fontSize: rem(1.1),
				textAlign: 'right',
				transformOrigin: 'right center'
			}],
			
			details: [FlexScale,{overflowX: 'auto'}],
			
			divider: [{
				borderBottomColor: primary.hue1,
				borderBottomWidth: rem(0.1),
				borderBottomStyle: 'solid'
			}]
		}]
		
	} ]
}


/**
 * IJobLogRowProps
 */
export interface IJobLogRowProps extends IThemedAttributes {
	rowState?:IRowState<any,string,IJobLog>
	controller?:JobMonitorController
}

/**
 * JobLogRow
 *
 * @class JobLogRow
 * @constructor
 **/

@ThemedStyles(baseStyles,'jobLog')
@PureRender
export class JobLogRow extends React.Component<IJobLogRowProps,void> implements IVisibleListRowComponent<any,string,IJobLog> {
	
	/**
	 * Get job monitor from context typed
	 *
	 * @returns {JobMonitorController}
	 */
	private get controller() {
		return this.props.controller
	}
	
	
	
	/**
	 * Get log level style
	 *
	 * @param logItem
	 */
	private levelStyle = (logItem:IJobLog) =>
		this.props.styles.levels[
			'WARN' === logItem.level ? 'warn' :
				'ERROR' === logItem.level ? 'error' :
					'DEBUG' === logItem.level ? 'success' :
						'info']
	
	
	
	render() {
		
		const
			{styles,rowState} = this.props
	
		log.debug(`Row state`,rowState)
		
		if (!rowState)
			return React.DOM.noscript()
		
		const
			selectedLogId = getValue(() => this.controller.selectedLogId),
			{item:logItem,index,key} = rowState,
			
			isError = logItem.level === 'ERROR',
			errorDetails = logItem.errorDetails,
			errorStyle = isError && this.levelStyle(logItem),
			logKey = logItem.id,
			selected = selectedLogId === logItem.id,
			hoverStyle =
				(selected || isHovering(this,logKey)) &&
				styles.entry.hovered
		
		
		return <div key={key}
		            onClick={() => !selected && this.controller.setSelectedLogId(logItem.id)}
		            style={[
									styles.entry,
										styles.entry.divider
								]}>
			<div style={[styles.entry.row]}>
				<div style={[styles.entry.level,hoverStyle,this.levelStyle(logItem)]}>
					{logItem.level}
				</div>
				<div style={[styles.entry.message,hoverStyle,errorStyle]}>
					{logItem.message}
				</div>
				<div style={[styles.entry.time,errorStyle]}>
					<TimeAgo timestamp={logItem.timestamp}/>
				</div>
			</div>
			
			{/* Error stack details */}
			{isError && errorDetails && <div style={[styles.entry.row, !selected && styles.entry.row.hidden ]}>
				<div style={[styles.entry.level]}>
					{/* Empty spacing place holder */}
				</div>
				<pre style={[styles.entry.details]}>
					<div>Error details: </div>
					<div>{errorDetails.message}</div>
					<div>{errorDetails.stack}</div>
				</pre>
			</div>}
		</div>
	}
	
}