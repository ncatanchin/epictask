/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import { createStructuredSelector } from "reselect"
import { connect } from "react-redux"

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
import { Checkbox } from "material-ui"
import { getUIActions, getAppActions,getAuthActions } from "epic-typedux"

import { ContainerNames } from "epic-command-manager"

import { DialogRoot } from 'epic-ui-components'

import { getValue, cloneObjectShallow, PersistentValue } from "epic-global"
import { settingsSelector } from "epic-typedux/selectors/AppSelectors"
import { Settings } from "epic-global/settings/Settings"


import { makeHeightConstraint } from "epic-styles/styles"
import { FlexColumnCenter,PureRender, Icon, Button,SelectField,Tabs } from "epic-ui-components/common"
import { KeyMapEditor } from "./KeyMapEditor"
import { SettingsSection, SettingsField } from "./SettingsElements"
import { ITab } from "epic-ui-components/common/tabs"
import { SheetRoot } from "epic-ui-components/layout/sheet"


const
	log = getLogger(__filename),
	{ Style } = Radium

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


// Settings Sections
const
	General = "General",
	Keys = "Keys"

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
			items: [
				makeHeightConstraint(rem(12)), {
					
					active: [ {
					} ],
					
					icon: [ makePaddingRem(1.5, 1), {
						fontSize: rem(4),
						
					} ]
				}
			],
		} ],
		
		
		actions: [ FlexRowCenter, FillHeight ],
		
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				//fontSize: rem(1.6),
				
				repo: [ makePaddingRem(0, 0.6, 0, 0), {} ],
				
				number: [ {
					paddingTop: rem(0.3),
					fontSize: rem(1.4),
					fontWeight: 100,
					color: text.secondary
				} ]
			} ]
		} ],
		
		form: [ Styles.FlexColumn, Styles.OverflowAuto, Styles.FlexScale,Styles.Fill, {
			content: [ Styles.FillWidth, makePaddingRem(3, 5), Styles.OverflowAuto, {
				maxWidth: 800
			} ],
			
			title: [ Styles.FlexAuto, Styles.FlexRow, Styles.makeFlexAlign('center', 'flex-start'), Styles.makePaddingRem(2, 1, 3, 1), {
				color: accent.hue1,
				fontSize: Styles.rem(2),
				
				icon: [ Styles.makePaddingRem(0, 1, 0, 0), {
					fontSize: Styles.rem(3),
				} ]
			} ],
			
			row: [ Styles.FlexAuto, Styles.FlexRowCenter, Styles.makePaddingRem(1, 2), {
				//backgroundColor: primary.hue2,
				
			} ],
			
			inputCell: [ Styles.makeFlex(0, 0, '35%'), {
				backgroundColor: primary.hue3
			} ],
			checkboxCell: [ Styles.makeFlex(0, 0, '35%'), {} ],
			
			labelCell: [ Styles.FlexScale, Styles.Ellipsis, Styles.makePaddingRem(1, 1, 1, 3), {
				color: text.primary,
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
	settings?: Settings
	
}

export interface ISettingsWindowState {
	tabValue?: any
}

/**
 * SettingsWindow
 *
 * @class SettingsWindow
 * @constructor
 **/
@connect(createStructuredSelector({
	settings: settingsSelector
}))
@ThemedStyles(baseStyles, 'SettingsWindow')
@PureRender
export class SettingsWindow extends React.Component<ISettingsWindowProps,ISettingsWindowState> {
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			tabValue: new PersistentValue<string>('settingsTab',General)
		}
	}
	
	
	/**
	 * Hide/close the window
	 */
	private hide = () => {
		const
			windowId = getWindowId()
		
		if (windowId)
			getUIActions().closeWindow(windowId)
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
	private changeTheme = (item: ISelectFieldItem) => {
		
		const
			themeName = item.value as string,
			theme = getThemeCreator(themeName)
		
		log.debug(`Setting theme: ${themeName}`)
		setThemeCreator(theme)
		
	}
	
	/**
	 * Debounce the update just in case
	 */
	private notifyNativeNotifications = _.debounce(() =>
		getNotificationCenter().notify("Notification configuration changed successfully")
	,150)
	
	/**
	 * Set selected palette
	 *
	 * @param item
	 */
	private changePalette = (item: ISelectFieldItem) => {
		const
			paletteName = item.value as string,
			palette = getPaletteCreator(paletteName)
		
		log.debug(`Setting palette name: ${paletteName}`)
		setPaletteCreator(palette)
	}
	
	/**
	 * Set the active tab
	 *
	 * @param tab
	 * @param index
	 */
	private onTabChanged = (tab:ITab,index) => {
		log.debug(`Tab changed`,tab,index)
		this.state.tabValue.set(tab.id)
		
		this.setState({
			tabValue: cloneObjectShallow(this.state.tabValue)
		})
	}
	
	
	renderGeneralSettings() {
		const
			{ styles, settings } = this.props,
			themeItems = getThemeNames().map(themeName => ({
				key: themeName,
				value: themeName,
				content: <span>{themeName}</span>
			})),
			themeName = getThemeName(),
			
			paletteItems = getPaletteNames().map(name => ({
				key: name,
				value: name,
				content: <span>{name}</span>
			})),
			paletteName = getPaletteName(),
		
			// DROPBOX TOKEN
			{dropboxToken} = settings
			
			
		return <div style={styles.form}>
			<div style={styles.form.content}>
				
				
				{/* PALETTES & THEMES */}
				<SettingsSection styles={styles}
				                 iconName="color_lens"
				                 iconSet="material-icons"
				                 title="Theme and Palette">
					
					<SettingsField styles={styles} label="Theme">
						<div style={styles.form.inputCell}>
							<SelectField
								items={themeItems}
								onItemSelected={this.changeTheme}
								value={themeItems.find(it => it.value === themeName)}
							/>
						</div>
					</SettingsField>
					
					<SettingsField styles={styles} label="Palette">
						<div style={styles.form.inputCell}>
							<SelectField
								items={paletteItems}
								onItemSelected={this.changePalette}
								value={paletteItems.find(it => it.value === paletteName)}
							/>
						</div>
					</SettingsField>
				</SettingsSection>
				
				
				{/* NATIVE NOTIFICATIONS */}
				<SettingsSection styles={styles} iconName="globe" iconSet="fa" title="Notifications">
					<SettingsField styles={styles} label="Desktop notifications (suggested) or in-app only.">
						<Checkbox style={styles.form.checkboxCell}
						          checked={getValue(() => settings.nativeNotificationsEnabled)}
						          onCheck={(event,isChecked) => {
							          	log.info(`Setting notifications enabled`,isChecked)
							          	updateSettings({
							          		nativeNotificationsEnabled: isChecked
							          	})
							          	
							          	this.notifyNativeNotifications()
							          }}/>
					</SettingsField>
				</SettingsSection>
				
				
				{/* DROPBOX LINK */}
				
				<SettingsSection styles={styles} iconName="dropbox" iconSet="fa" title="Dropbox Asset Storage">
					<SettingsField styles={styles}
					               label="Link Dropbox for storing images in markdown editor">
						
						{!dropboxToken ?
							<Button style={styles.form.inputCell} onClick={() => getAuthActions().startDropboxAuth()}>
								<div>
									<Icon iconSet="fa" iconName="dropbox"/> Link Dropbox
								</div>
							</Button>
							:
							<Button style={styles.form.inputCell} onClick={() => getAuthActions().unlinkDropbox()}>
								<div>
									<Icon iconSet="fa" iconName="dropbox"/> Unlink Dropbox
								</div>
							</Button>
						}
					</SettingsField>
				</SettingsSection>
				
				
				{/* RESET APP */}
				<SettingsSection styles={styles} iconName="clear_all" iconSet="material-icons" title="Reset">
					<SettingsField styles={styles}
					               label="Remove all internal files and settings.">
						<Button style={styles.form.inputCell} onClick={() => getAppActions().clean()}>RESET</Button>
					</SettingsField>
				</SettingsSection>
			
			</div>
		</div>
		
	}
	
	renderKeymapEditor() {
		const
			{styles} = this.props
		
		return <div style={styles.form}>
			<div style={styles.form.content}>
				<KeyMapEditor styles={styles}/>
			</div>
		</div>
	}
	
	render() {
		const
			{ styles, settings } = this.props,
			{ tabValue } = this.state,
		
			tabId = tabValue.get(),
			
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				Settings
			</div>,
			
			
			iconStyle = styles.tabs.items.icon,
			
			activeIconStyle = makeStyle(iconStyle, styles.tabs.items.active),
			
			getIconStyle = (tabName) => tabId === tabName ? activeIconStyle : iconStyle
		
		return <div
			id={ContainerNames.SettingsWindow}
			style={makeStyle(Fill)}>
			
			<DialogRoot
				title="settings"
				titleMode='horizontal'
				titleNode='settings'
				styles={styles.dialog}
			>
				
				<Tabs
					tabId={tabId}
					onTabChanged={this.onTabChanged}
					tabs={[
						{
							id: General,
							title: <FlexColumnCenter>
								<Icon style={styles.tabs.items.icon}>settings</Icon>
								<div style={makeStyle(tabId === General && styles.tabs.items.active)}>GENERAL</div>
							</FlexColumnCenter>,
							
							content:this.renderGeneralSettings()
						},
						{
							id: Keys,
							title: <FlexColumnCenter>
								<Icon style={styles.tabs.items.icon}>keyboard</Icon>
								<div style={makeStyle(tabId === General && styles.tabs.items.active)}>SHORTCUTS</div>
							</FlexColumnCenter>,
							
							content:this.renderKeymapEditor()
						}
					]}
					style={makeStyle(FlexColumn,FlexScale)}
				/>
					
					
			
			
			</DialogRoot>
			
			<SheetRoot allowedURIs={[/capture-accelerator/]}/>
		</div>
	}
	
}


export default SettingsWindow

