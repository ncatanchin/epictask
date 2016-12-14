// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender, KeyboardAccelerator, FormButton } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { getValue } from "typeguard"
import { getCommandManager, CommandAccelerator } from "epic-command-manager"
import { customAcceleratorsSelector } from "epic-typedux/selectors"
import { makeIcon, makeWidthConstraint, makeHeightConstraint } from "epic-styles/styles"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { getAppActions, getUIActions } from "epic-typedux/provider"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, alternateText,primary, accent, background,success } = palette
	
	return [ Styles.FlexColumnCenter,Styles.makePaddingRem(4), {
		
		backgroundColor: accent.hue1,
		color: text.primary,
		fontSize:rem(1.7),
		fontWeight:500,
		
		current: [Styles.FlexRowCenter,Styles.makePaddingRem(1.1,0,0.5,0),{
			fontSize:rem(1.4),
			fontWeight:300
		}],
		
		name: [Styles.makePaddingRem(0.5,1),Styles.makeMarginRem(0,0.5),{
			borderRadius: rem(0.3),
			display: 'inline-block',
			backgroundColor: text.primary,
			color: accent.hue1,
		}],
		
		accelerator: [{
			fontSize:rem(1.4),
			fontWeight:700
		}],
		
		newAccelerator: [Styles.makePaddingRem(3,2,2,2),{
			
			fontSize:rem(3.2),
			fontWeight:700
		}],
		
		icon: [
			Styles.FlexColumnCenter,
			Styles.CursorPointer,
			makeWidthConstraint(rem(4.4)),
			makeHeightConstraint(rem(4.4)),
			Styles.makeTransition(['background-color','color']),{
				borderRadius: rem(2.2),
				fontSize: rem(3),
				color: text.primary,
				backgroundColor: Styles.Transparent,
				//backgroundColor: success.hue1,
				[Styles.CSSHoverState]: {
					color: text.primary,
					backgroundColor: success.hue1,
				}
			}]
		
	} ]
}


/**
 * ICaptureAcceleratorSheetProps
 */
export interface ICaptureAcceleratorSheetProps extends IThemedAttributes {
	sheetParams:any
	customAccelerators:Map<string,string>
}

/**
 * ICaptureAcceleratorSheetState
 */
export interface ICaptureAcceleratorSheetState {
	keyEvent:KeyboardEvent
}

/**
 * CaptureAcceleratorSheet
 *
 * @class CaptureAcceleratorSheet
 * @constructor
 **/

@connect(createStructuredSelector({
	customAccelerators: customAcceleratorsSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class CaptureAcceleratorSheet extends React.Component<ICaptureAcceleratorSheetProps,ICaptureAcceleratorSheetState> {
	
	
	
	
	get commandId() {
		return getValue(() => this.props.sheetParams.commandId)
	}
	
	private keyInterceptor = (keyEvent:KeyboardEvent) => {
		
		this.setState({
			keyEvent
		})
		
		return false
	}
	
	componentWillMount() {
		getCommandManager().setKeyInterceptor(this.keyInterceptor)
	}
	
	componentWillUnmount() {
		getCommandManager().setKeyInterceptor(null)
	}
	
	render() {
		const
			{commandId:cmdId} = this,
			cmd = Commands[cmdId] as ICommand,
			
			{ styles,palette,customAccelerators } = this.props,
			{keyEvent} = this.state,
			
			accelerator = customAccelerators.get(cmdId) || cmd.defaultAccelerator,
			
			//cmdAccelerator = new CommandAccelerator(accelerator),
			newCmdAccelerator = new CommandAccelerator(keyEvent || accelerator)
		
		
		
		
		return <div
			style={styles}>
			<div style={styles.prompt}>Re-mapping <div style={styles.name}>{cmd.name.toUpperCase()}</div>, waiting for keys...</div>
			{/*<div style={styles.current}>*/}
				{/*<span>the current accelerator is&nbsp;</span>*/}
				{/*<KeyboardAccelerator*/}
					{/*style={styles.accelerator}*/}
					{/*accelerator={cmdAccelerator} />*/}
			{/*</div>*/}
			{newCmdAccelerator && <KeyboardAccelerator
				style={styles.newAccelerator}
				accelerator={newCmdAccelerator}  />}
				
			{keyEvent && newCmdAccelerator &&
			<Icon
				onClick={() => {
					getAppActions().setCustomAccelerator(cmdId,newCmdAccelerator.toElectronAccelerator())
					getUIActions().closeSheet()
				}}
				style={styles.icon} iconSet='fa' iconName="check-circle"/>
			}
		</div>
	}
	
}