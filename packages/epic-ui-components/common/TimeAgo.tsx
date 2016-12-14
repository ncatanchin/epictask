// Imports
import {PureRender} from "./PureRender"
import { getValue, guard } from "epic-global"


// Constants
const log = getLogger(__filename)

/**
 * ITimeAgo.tsxProps
 */
export interface ITimeAgoProps extends React.HTMLAttributes<any> {
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


@PureRender
export class TimeAgo extends React.Component <ITimeAgoProps, ITimeAgoState> {
	
	componentDidMount() {
		this.setState({
			updateTimer: setInterval(() => this.forceUpdate(),2500) as any
		})
	}
	
	componentWillUnmount() {
		guard(() => clearInterval(this.state.updateTimer))
	}
	
	
	
	render() {
		const {timestamp} = this.props
		
		return <span {..._.omit(this.props,'timestamp')}>
			{moment(timestamp).fromNow()}
		</span>
	}
	
}