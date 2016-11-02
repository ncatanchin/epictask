/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import filterProps from 'react-valid-props'

import {FAIcons} from "./IconFontAwesomeNames"
import {GHIcons} from "./IconOpticonNames"
import { PureRender } from "../PureRender"


// Constants
const
	log = getLogger(__filename),

	MaterialIcons = 'material-icons',
	FontAwesome = 'fa',
	Octicons = 'octicon'

/**
 * IMIconProps
 */
export interface IIconProps extends React.HTMLAttributes<any> {
	className?:string
	style?:any
	theme?:any
	iconSet?:'material-icons'|'fa'|'octicon'
	iconName?: string,
	fontSize?:any
}

function iconCode(codeSet,iconName) {
	let code = codeSet[iconName]
	if (!code)
		return ''

	code = (_.isNumber(code)) ? code : parseInt(code,16)

	return String.fromCodePoint(code)
}

/**
 * MIcon
 *
 * @class Icon
 * @constructor
 **/



//@Themed
@Radium
@PureRender
export class Icon extends React.Component<IIconProps,any> {

	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	//
	// componentWillMount() {
	// 	this.state = {}
	// }

	render() {
		let
			{className = '',style,iconName,children,fontSize} = this.props
			
		if (Array.isArray(style)) {
			style = mergeStyles(...style)
		}
		
		const
			iconSet = this.props.iconSet || MaterialIcons,
			declaredIconSet = [MaterialIcons,FontAwesome,Octicons]
				.filter(name => className.indexOf(name) > -1).length > 0


		if (!declaredIconSet) {
			className += ' ' + iconSet
		}


		const iconContent = (iconSet === FontAwesome) ?
			iconCode(FAIcons,iconName) : (iconSet === Octicons) ?
			iconCode(GHIcons,iconName) :
			children

		return <span {...filterProps(this.props)} {..._.pick(this.props,'onClick')}  style={style} className={className}>
			{iconContent}
		</span>
	}

}
