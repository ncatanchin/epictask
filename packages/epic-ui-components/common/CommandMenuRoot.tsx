// Imports

import { ThemedStyles, IThemedAttributes, colorAlpha } from "epic-styles"
import {
	getCommandSimpleMenuManager,
	CommandSimpleMenuManagerEventType,
	CommandSimpleMenuManager,
	CommandAccelerator,
	getCommandManager
} from "epic-command-manager"
import { ICommandMenuItem, CommandMenuItemType, isCommandFontIcon, isCommandImageIcon } from "epic-command-manager"
import { getValue } from "epic-global"
import { NavigationChevronLeft as SvgArrowLeft, NavigationMoreVert as SvgNavMoreIcon } from "material-ui/svg-icons"
import { IconMenu, IconButton, MenuItem, Divider } from "material-ui"
import { isString } from "epic-global"
import { PureRender } from "./PureRender"
import { Icon} from "./icon/Icon"
import { KeyboardAccelerator} from "./Labels"

import {IEnumEventRemover} from 'type-enum-events'
// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent,secondary, background } = palette
	
	
	return [ {
		root: [{
			WebkitAppRegion: 'no-drag'
		}],
		menuItem: [makePaddingRem(0)],
		item: [FlexRowCenter,FillHeight,FillWidth,makePaddingRem(0),{
			textAlign: 'right',
			borderBottom: `0.1rem solid ${colorAlpha(primary.hue1,0.8)}`,
			minWidth: rem(20)
		}],
		
		button: {
			color: text.primary
		},
		
		icon: [FlexAuto,FillHeight,FlexRowCenter,makeMarginRem(0,1,0,1),{
			width: rem(2.4),
			
			
			label: [{
				
				left: [{
					color: text.secondary
				}],
				right: [{
					color: secondary.hue1,
					fontWeight: 700
				}]
			}],
			
			right: [{
				
			}]
			
		}],
		
		label: [makePaddingRem(0,1),FlexScale,Ellipsis],
		
		accelerator: [FillHeight,FlexAuto,makePaddingRem(0,1,0,1),{
			fontWeight: 700,
			fontSize: rem(1.3),
			color: accent.hue1
		}]
		
	} ]
}


/**
 * ICommandMenuRootProps
 */
export interface ICommandMenuRootProps extends IThemedAttributes {
	
}

/**
 * ICommandMenuRootState
 */
export interface ICommandMenuRootState {
	menuManager?:CommandSimpleMenuManager
	menuRootItems?:ICommandMenuItem[]
	menuUnsubscribe?:IEnumEventRemover
	menuNode?:any
	
	iconButton?:any
}

/**
 * CommandMenuRoot
 *
 * @class CommandMenuRoot
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class CommandMenuRoot extends React.Component<ICommandMenuRootProps,ICommandMenuRootState> {
	
	/**
	 * Ref to command manager
	 *
	 * @type {CommandManager}
	 */
	private commandManager = getCommandManager()
	
	/**
	 * Make menu items array
	 *
	 * @param menuItems
	 * @param isSubItem
	 */
	private makeItems(menuItems:ICommandMenuItem[], isSubItem = false) {
		const
			{styles} = this.props
		
		return menuItems.map(item => {
			
			// IF SEP - RETURN DIVIDER
			if (item.type === CommandMenuItemType.Separator)
				return <Divider key={item.id} />
			
			let
				leftIcon,
				rightIcon
			
			const
				{icon,subItems,commandId} = item,
				
				cmd = commandId && this.commandManager.getCommand(commandId),
				
				subItemCount = getValue(() => subItems.length,0),
				
				label = item.label || getValue(() => cmd.name,'unknown'),
				
				menuProps = {
					childAnchorOrigin: {vertical: 'top',horizontal: 'left'},
					childTargetOrigin:{vertical: 'top',horizontal: 'right'},
					
				} as any
					
					
			if (subItemCount || item.type === CommandMenuItemType.Menu) {
				leftIcon = <SvgArrowLeft style={styles.icon.label.left}/>
				assign(menuProps,{
					menuItems: !subItemCount ?
						[] :
						this.makeItems(subItems,true)
				})
			}
			
			if (icon) {
				
				if (isCommandFontIcon(icon)) {
					rightIcon = <Icon iconSet={icon.iconSet as any}
					                  style={styles.icon.label.right}
					                  iconName={icon.iconName} />
				} else if (isCommandImageIcon(icon) || isString(icon)) {
					const
						url = isString(icon) ? icon : icon.url
					rightIcon = <img src={url} />
				}
				
			}
			
			
							
			// EXECUTE FUNC
			if (cmd && cmd.execute) {
				assign(menuProps, {
					onTouchTap: (event) => cmd.execute(cmd, event)
				})
			}
				
			menuProps['primaryText'] = <div style={makeStyle(styles.item)}>
				<div style={makeStyle(styles.icon,styles.icon.left)}>{leftIcon}</div>
				<div style={makeStyle(styles.label)}>{label}</div>
				{getValue(() => cmd.defaultAccelerator) ?
					<KeyboardAccelerator
						style={styles.accelerator}
						separator=''
						accelerator={new CommandAccelerator(cmd.defaultAccelerator)}/> :
					<div style={makeStyle(styles.icon,styles.icon.right)}>{rightIcon}</div>
				}
				
			</div>
			
			return <MenuItem key={item.id} innerDivStyle={styles.menuItem} style={styles.menuItem} {...menuProps} />
			
		})
	}
	
	private makeMenu(menuItems:ICommandMenuItem[]) {
		log.debug(`Making menu with items`,menuItems)
		
		const
			{ styles } = this.props,
			
			iconButton = <IconButton iconStyle={this.props.styles.button}>
				<SvgNavMoreIcon />
			</IconButton>
		
		return <IconMenu
			ref={this.setIconButton}
			anchorOrigin={{vertical: 'bottom',horizontal: 'right'}}
			targetOrigin={{vertical: 'top',horizontal: 'right'}}
			style={styles.root}
			iconButtonElement={iconButton}>
			
			{this.makeItems(menuItems)}
			
		</IconMenu>
		
	}
	
	private setIconButton = (iconButton) => this.setState({iconButton},() => {
		const
			node = ReactDOM.findDOMNode(iconButton),
			elem = $(node),
			setHover = (hovering) =>  {
				const
					{palette} = this.props
				
				elem.css({
					backgroundColor: hovering ? palette.accent.hue1 : Transparent
				})
			}
		
		log.debug(`Binding to icon button`,node,elem)
		setHover(false)
		
		elem.css(makeTransition('background-color'))
		elem.hover(() =>setHover(true),() => setHover(false))
		
	})
	
	/**
	 * On mount subscribe for menu updates and
	 * create initial state
	 */
	componentWillMount() {
		const
			menuManager = getCommandSimpleMenuManager(),
			menuRootItems = menuManager.getRootItems(),
			menuNode = this.makeMenu(menuRootItems)
		
		this.setState({
			menuManager,
			menuRootItems,
			menuNode,
			
			// ON UPDATE SET THE ROOT ITEMS AND REBUILD THE MENU
			menuUnsubscribe: menuManager.on(
				CommandSimpleMenuManagerEventType.MenuChanged, (event,newMenuRootItems) => {
					setImmediate(() => {
						this.setState({
							menuRootItems: newMenuRootItems,
							menuNode: this.makeMenu(newMenuRootItems),
						})
					})
				})
		})
	}
	
	/**
	 * On unmount - unsubscribe from menu updates
	 */
	componentWillUnmount() {
		const
			unsub = getValue(() => this.state.menuUnsubscribe)
		
		if (unsub)
			unsub()
	}
	
	render() {
		const
			menuNode = getValue(() => this.state.menuNode,<div/>)
		
		return menuNode
	}
	
}