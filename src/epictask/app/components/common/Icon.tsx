/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {FontIcon} from 'material-ui'
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
	extraStyle?:any
	iconSet?:string
	iconName?: string,
	fontSize?:any

}

/**
 * MIcon
 *
 * @class Icon
 * @constructor
 **/

export class Icon extends React.Component<IIconProps,any> {

	constructor(props = {}) {
		super(props)
	}

	render() {
		let {iconSet = MaterialIcons,className = '',extraStyle,style,iconName,children,fontSize} = this.props

		iconSet = iconSet || MaterialIcons
		const declaredIconSet = [MaterialIcons,FontAwesome]
				.filter(name => className.indexOf(name) > -1).length > 0


		if (!declaredIconSet) {
			className += ' ' + iconSet
		}

		style = makeStyle(style,extraStyle) as any

		if (fontSize) {
			style.fontSize = fontSize
		}

		const iconContent = (iconSet === FontAwesome) ?
			String.fromCodePoint(parseInt(FAIcons[iconName])) :
			children

		return <FontIcon {...this.props} className={className} style={style}>
			{iconContent}
		</FontIcon>
	}

}
