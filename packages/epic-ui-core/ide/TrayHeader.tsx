// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { makeHeightConstraint } from "epic-styles/styles"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexColumn, Styles.FlexAuto, Styles.FillWidth,{
		
		tray: [{
			height: rem(3),
			
			title: [{
				top: '50%',
				transform: 'translate(-50%,-50%)',
			}]
		}]
	} ]
}


/**
 * ITrayHeaderProps
 */
export interface ITrayHeaderProps extends IThemedAttributes {
	title:string
	actions?:any
}

/**
 * ITrayHeaderState
 */
export interface ITrayHeaderState {
	
}



/**
 * TrayHeader
 *
 * @class TrayHeader
 * @constructor
 **/

@ThemedStyles(baseStyles,'header')
export class TrayHeader extends React.Component<ITrayHeaderProps,any> {
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	render() {
		const
			{styles, title} = this.props
		
		return <div style={[styles,styles.tray]}>
			<div style={[styles.title,styles.tray.title]}>{title}</div>
		</div>
	}
}
