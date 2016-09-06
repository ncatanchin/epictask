// Imports
import * as moment from 'moment'
import * as React from 'react'
import * as Radium from 'radium'
import {PureRender} from 'ui/components/common'


// Constants
const log = getLogger(__filename)

/**
 * ITimeAgo.tsxProps
 */
export interface ITimeAgoProps extends React.HTMLAttributes {
	timestamp:number
}

/**
 * ITimeAgo.tsxState
 */
export interface ITimeAgoState {
	updateTimer:number
}

/**
 * TimeAgo
 *
 * @class TimeAgo
 * @constructor
 **/

@Radium
@PureRender
export class TimeAgo extends React.Component <ITimeAgoProps, ITimeAgoState> {
	
	componentDidMount() {
		this.setState({
			updateTimer: setInterval(() => this.forceUpdate(),2500) as any
		})
	}
	
	componentWillUnmount() {
		const updateTimer = _.get(this.state,'updateTimer') as number
		if (updateTimer) {
			clearInterval(updateTimer)
		}
	}
	
	
	
	render() {
		const {timestamp} = this.props
		
		return <span {..._.omit(this.props,'timestamp')}>
			{moment(timestamp).fromNow()}
		</span>
	}
	
}