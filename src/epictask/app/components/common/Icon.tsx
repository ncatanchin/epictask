/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {FAIcons} from './IconFontAwesomeNames'

// Constants
const log = getLogger(__filename)

const MaterialIcons = 'material-icons'
const FontAwesome = 'fa'

/**
 * IMIconProps
 */
export interface IIconProps extends React.DOMAttributes {
	className?:string
	style?:any
	iconSet?:string
	iconName?: string,
	fontSize?:any

}

function faIconCode(iconName) {
	const code = FAIcons[iconName]
	return (code) ? String.fromCodePoint(parseInt(code,16)) : ''
}

/**
 * MIcon
 *
 * @class Icon
 * @constructor
 **/
@Radium
export class Icon extends React.Component<IIconProps,any> {

	constructor(props = {}) {
		super(props)
	}

	render() {
		let {iconSet = MaterialIcons,className = '',style,iconName,children,fontSize} = this.props

		iconSet = iconSet || MaterialIcons
		const declaredIconSet = [MaterialIcons,FontAwesome]
				.filter(name => className.indexOf(name) > -1).length > 0


		if (!declaredIconSet) {
			className += ' ' + iconSet
		}


		const iconContent = (iconSet === FontAwesome) ?
			faIconCode(iconName) :
			children

		return <i {...this.props} className={className} style={style}>
			{iconContent}
		</i>
	}

}
