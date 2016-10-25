/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import { createStructuredSelector } from "reselect"
import { connect } from "react-redux"
import { User } from "epic-models"
import {
	ThemedStyles,
	FlexColumn,
	FlexAuto,
	FlexRowCenter,
	FillHeight,
	makeFlex,
	OverflowAuto,
	FillWidth,
	FlexScale,
	Ellipsis,
	makePaddingRem,
	rem,
	Fill,
	makeStyle,
	makeFlexAlign,
	FlexRow,
	IThemedAttributes,
	getPaletteName,
	getThemeName,
	getThemeNames,
	getPaletteNames,
	getThemeCreator,
	getPaletteCreator,
	setThemeCreator,
	setPaletteCreator
} from "epic-styles"
import { appUserSelector, getUIActions, getAppActions } from "epic-typedux"
import { CommandComponent, CommandContainerBuilder, CommandRoot, ContainerNames } from "epic-command-manager"
import { Checkbox } from "material-ui"
import { PureRender, Select, ISelectItem, DialogRoot, Icon, Button } from "epic-ui-components"
import { NativeNotificationsEnabled, PersistentValueEvent, getValue } from "epic-global"


const
	log = getLogger(__filename),
	{ Style } = Radium

// DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

const baseStyles = (topStyles, theme, palette) => {
	const
		{
			accent,
			warn,
			text,
			primary,
			secondary
		} = palette,
		
		rowStyle = [ FlexRow, FlexAuto, FlexAlignStart, FillWidth, makePaddingRem(0, 1) ]
	
	return {
		dialog: [ {
			minHeight: 500,
			minWidth: 500
		} ],
		
		root: [ FlexColumn, FlexAuto ],
		
		tabs: [ {
			icon: [ {
				fontSize: rem(4)
			} ]
		} ],
		
		actions: [ FlexRowCenter, FillHeight ],
		
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				fontSize: rem(1.6),
				
				repo: [ makePaddingRem(0, 0.6, 0, 0), {} ],
				
				number: [ {
					paddingTop: rem(0.3),
					fontSize: rem(1.4),
					fontWeight: 100,
					color: text.secondary
				} ]
			} ]
		} ],
		
		form: [ FlexColumn, OverflowAuto, Fill, {
			content: [ FillWidth, makePaddingRem(3, 5), {
				maxWidth: 800
			} ],
			
			title: [ FlexAuto, FlexRow, makeFlexAlign('center', 'flex-start'), makePaddingRem(2, 1, 3, 1), {
				color: accent.hue1,
				fontSize: rem(2),
				
				icon: [ makePaddingRem(0, 1, 0, 0), {
					fontSize: rem(3),
				} ]
			} ],
			
			row: [ FlexAuto, FlexRowCenter, makePaddingRem(1, 2), {
				//backgroundColor: primary.hue2,
				
			} ],
			
			inputCell: [ makeFlex(0, 0, '35%'), {
				backgroundColor: primary.hue3
			} ],
			checkboxCell: [ makeFlex(0, 0, '35%'), {
				
			} ],
			
			labelCell: [ FlexScale, Ellipsis, makePaddingRem(1, 1, 1, 3), {
				
				fontSize: rem(1.5),
				fontWeight: 400
			} ]
		} ]
	}
}


/**
 * ISettingsWindowProps
 */
export interface ISettingsWindowProps extends IThemedAttributes {
	user?:User
	
}

export interface ISettingsWindowState {
	nativeNotificationsEnabled?:boolean
}

/**
 * SettingsWindow
 *
 * @class SettingsWindow
 * @constructor
 **/
@connect(createStructuredSelector({
	user: appUserSelector
}))
@CommandComponent()
@ThemedStyles(baseStyles, 'dialog', 'SettingsWindow', 'form')
@PureRender
export class SettingsWindow extends React.Component<ISettingsWindowProps,ISettingsWindowState> {
	
	/**
	 * Command items
	 *
	 * @param builder
	 */
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			
			.make()
	
	
	/**
	 * Component id
	 *
	 * @type {string}
	 */
	commandComponentId = ContainerNames.SettingsWindow
	
	
	/**
	 * Hide/close the window
	 */
	private hide = () => {
		const
			childWindowId = getChildWindowId()
		
		if (childWindowId)
			getUIActions().closeWindow(childWindowId)
	}
	
	/**
	 * On cancel - call hide
	 */
	private close = this.hide
	
	
	/**
	 * Set selected theme
	 *
	 * @param item
	 */
	private changeTheme = (item:ISelectItem) => {
		
		const
			themeName = item.value as string,
			theme = getThemeCreator(themeName)
		
		log.debug(`Setting theme: ${themeName}`)
		setThemeCreator(theme)
		
	}
	
	/**
	 * Set selected palette
	 *
	 * @param item
	 */
	private changePalette = (item:ISelectItem) => {
		const
			paletteName = item.value as string,
			palette = getPaletteCreator(paletteName)
		
		log.debug(`Setting palette name: ${paletteName}`)
		setPaletteCreator(palette)
	}
	
	onNativeNotificationsChanged = () => {
		log.info(`Notifications changed`,NativeNotificationsEnabled.get())
		this.setState({
			nativeNotificationsEnabled: NativeNotificationsEnabled.get()
		})
	}
	
	componentWillMount() {
		this.onNativeNotificationsChanged()
		NativeNotificationsEnabled.on(PersistentValueEvent.Changed,this.onNativeNotificationsChanged)
	}
	
	componentWillUnmount() {
		NativeNotificationsEnabled.removeListener(PersistentValueEvent.Changed,this.onNativeNotificationsChanged)
	}
	
	render() {
		const
			{ styles, theme, palette } = this.props,
			
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				Settings
			</div>,
			
			themeItems = getThemeNames().map(themeName => ({
				key: themeName,
				value: themeName,
				node: <span>{themeName}</span>
			})),
			themeName = getThemeName(),
			
			paletteItems = getPaletteNames().map(name => ({
				key: name,
				value: name,
				node: <span>{name}</span>
			})),
			paletteName = getPaletteName()
		
		return <CommandRoot
			id={ContainerNames.SettingsWindow}
			component={this}
			style={makeStyle(Fill)}>
			
			<DialogRoot
				titleMode='horizontal'
				titleNode={titleNode}
				styles={styles.dialog}
			>
				
				<div style={styles.form}>
					<div style={styles.form.content}>
						
						
						{/* PALETTES & THEMES */}
						<div style={styles.form.title}>
							<Icon style={styles.form.title.icon}>color_lens</Icon> <span>Theme and Palette</span>
						</div>
						
						
						<div style={styles.form.row}>
							
							<div style={styles.form.labelCell}>
								Theme
							</div>
							<div style={styles.form.inputCell}>
								<Select items={themeItems}
								        onSelect={this.changeTheme}
								        underlineShow={false}
								        value={themeName}/>
							</div>
						</div>
						
						
						<div style={styles.form.row}>
							
							<div style={styles.form.labelCell}>
								Palette
							</div>
							<div style={styles.form.inputCell}>
								<Select items={paletteItems}
								        onSelect={this.changePalette}
								        underlineShow={false}
								        value={paletteName}/>
							</div>
						
						</div>
						
						{/* NATIVE NOTIFICATIONS */}
						<div style={styles.form.title}>
							<Icon style={styles.form.title.icon} iconSet="fa" iconName="globe"/> <span>Reset</span>
						</div>
						<div style={styles.form.row}>
							<div style={styles.form.labelCell}>
								Desktop notifications (suggested) or in-app only.
							</div>
							
							<Checkbox style={styles.form.checkboxCell}
							          checked={getValue(() => this.state.nativeNotificationsEnabled)}
							          onCheck={(event,isChecked) => {
							          	log.info(`Setting notifications enabled`,isChecked)
							          	NativeNotificationsEnabled.set(isChecked)
							          }} />
						
						</div>
						
						
						{/* RESET APP */}
						<div style={styles.form.title}>
							<Icon style={styles.form.title.icon} iconSet="fa" iconName="globe"/> <span>Reset</span>
						</div>
						<div style={styles.form.row}>
							<div style={styles.form.labelCell}>
								Remove all internal files and settings.
							</div>
							
							<Button style={styles.form.inputCell} onClick={() => getAppActions().clean()}>RESET</Button>
						
						</div>
					</div>
				</div>
			
			
			</DialogRoot>
		</CommandRoot>
	}
	
}


export default SettingsWindow