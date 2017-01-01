/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import filterProps from 'react-valid-props'

import {FAIcons} from "./IconFontAwesomeNames"
import {GHIcons} from "./IconOpticonNames"
import { PureRender } from "../PureRender"
import { ITooltipNodeProps,Tooltip } from "../Tooltip"


declare global {
	type TIconSet = 'material-icons'|'fa'|'octicon'
}
// Constants
const
	log = getLogger(__filename),

	MaterialIcons = 'material-icons',
	FontAwesome = 'fa',
	Octicons = 'octicon'

/**
 * IMIconProps
 */
export interface IIconProps extends React.HTMLAttributes<any>,ITooltipNodeProps {
	//className?:string
	theme?:any
	iconSet?:TIconSet
	iconName?: string,
	fontSize?:any,
	tooltip?:string
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
			{className = '',style,tooltip,tooltipPos,iconName,children,fontSize} = this.props
			
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


		let
			iconContent = (iconSet === FontAwesome) ?
				iconCode(FAIcons,iconName) : (iconSet === Octicons) ?
				iconCode(GHIcons,iconName) :
				children

		if (iconName && iconSet === MaterialIcons) {
			iconContent = iconName
			iconName = null
		}
		
		return <span {...filterProps(this.props)} style={style} className={className}>
			{tooltip && <Tooltip text={tooltip} pos={tooltipPos}/>}
			{iconContent}
		</span>
	}

}
