// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { makeHeightConstraint } from "epic-styles/styles"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { ContextMenu } from "epic-global"
import { trayAlwaysOnTopSelector, trayAutoHideSelector } from "epic-typedux/selectors"
import { getAppActions } from "epic-typedux/provider"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexColumn, Styles.FlexAuto, Styles.FillWidth,{
		
		tray: [Styles.PositionRelative,{
			height: rem(3),
			
			title: [Styles.makePaddingRem(0,3),{
				top: '50%',
				maxWidth: '100%',
				transform: 'translate(-50%,-50%)',
			}],
			
			icon: [Styles.PositionAbsolute,Styles.makePaddingRem(0,1),{
				WebkitAppRegion: 'no-drag',
				
				right:0,
				top: '50%',
				transform: 'translate(0,-50%)'
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
	
	alwaysOnTop?:boolean
	autoHide?:boolean
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
@connect(createStructuredSelector({
	alwaysOnTop: trayAlwaysOnTopSelector,
	autoHide: trayAutoHideSelector,
}))
@ThemedStyles(baseStyles,'header')
@PureRender
export class TrayHeader extends React.Component<ITrayHeaderProps,any> {
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	/**
	 * Show opens context
	 */
	private showOptions = event => {
		const
			{alwaysOnTop,autoHide} = this.props
		
		ContextMenu.create()
			.addCheckbox(`Always on top`,alwaysOnTop,() => getAppActions().setTrayAlwaysOnTop(!alwaysOnTop))
			.addCheckbox(`Auto hide`,autoHide,() => getAppActions().setTrayAutoHide(!autoHide))
			.addCommand(`Hide`,() => getAppActions().closeTray())
			.popup()
	}
	
	/**
	 * Render the tray header
	 *
	 * @returns {any}
	 */
	render() {
		const
			{styles, title} = this.props
		
		return <div style={[styles,styles.tray]}>
			<div
				style={[
					styles.title,
					styles.tray.title
				]}>
				{title}
			</div>
			<Icon style={styles.tray.icon} onClick={this.showOptions}>
				settings
			</Icon>
		</div>
	}
}
