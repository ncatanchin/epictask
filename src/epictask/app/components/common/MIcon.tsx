/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {FontIcon} from 'material-ui'

// Constants
const log = getLogger(__filename)

// /**
//  * IMIconProps
//  */
// export interface IMIconProps {
//
// }

/**
 * MIcon
 *
 * @class MIcon
 * @constructor
 **/

export class MIcon extends React.Component<any,any> {

	static getInitialState() {
		return {}
	}

	constructor(props = {}) {
		super(props)
	}

	render() {
		let className = this.props.className || ''
		if (className.indexOf('fa') === -1) {
			className += ' material-icons'
		}
		
		const style:any = Object.assign({},this.props.style || {},this.props.extraStyle)

		if (this.props.fontSize) {
			style.fontSize = this.props.fontSize
		}

		return <FontIcon {...this.props} className={className} style={style}>
			{this.props.children}
		</FontIcon>
	}

}
