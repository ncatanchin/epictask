/**
 * Created by jglanz on 6/14/16.
 */

// Imports

import { createStructuredSelector } from 'reselect'
import { connect } from 'react-redux'

import {Tabs, Tab} from 'material-ui/Tabs'
import {FontIcon} from 'material-ui'

import { User } from 'shared/models/User'


import {createCancelButton} from 'ui/components/common'
import { ThemedStyles} from 'shared/themes/ThemeManager'
import { appUserSelector } from 'shared/actions/app/AppSelectors'
import { DialogRoot} from "ui/components/common/DialogRoot"
import { getUIActions} from "shared/actions/ActionFactoryProvider"
import {
	makeHeightConstraint, FlexColumn, FlexAuto, FlexRowCenter, FillHeight, makeFlex,
	OverflowAuto, FlexColumnCenter, FillWidth, FlexScale, Ellipsis, makePaddingRem, rem, Fill
} from "shared/themes/styles"
import { CommandComponent, CommandContainerBuilder, CommandRoot } from "shared/commands/CommandComponent"
import { CommandType } from "shared/commands/Command"
import { ContainerNames } from "shared/config/CommandContainerConfig"
import { PureRender, Select, ISelectItem } from "ui/components/common"
import { IThemedAttributes } from "shared/themes/ThemeDecorations"
import { getCommandManager } from "shared/commands/CommandManager"
import {
	getPaletteName, getThemeName, getThemeNames,
	getPaletteNames, getThemeCreator, getPaletteCreator, setThemeCreator, setPaletteCreator
} from "shared/themes/ThemeState"
import { TabTemplate } from "ui/components/common/TabTemplate"


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
		
		tabs: [{
			icon: [{
				fontSize: rem(4)
			}]
		}],
		
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
		
		form: [FlexColumn,OverflowAuto,Fill,{
			content: [FillWidth,makePaddingRem(2,5),{
				maxWidth: 800
			}],
			
			title: [FlexAuto, makePaddingRem(2,1,3,1),{
				color: accent.hue1,
				fontSize: rem(2)
			}],
			
			row: [FlexAuto,FlexRowCenter,makePaddingRem(1,2),{
				backgroundColor: primary.hue1,
				
			}],
			
			inputCell: [makeFlex(0,0,'40%'),{
				backgroundColor: primary.hue2
			}],
			
			labelCell: [FlexScale,Ellipsis,makePaddingRem(1,1,1,3),{
				
				fontSize: rem(1.3),
				fontWeight: 400
			}]
		}],
		
		
	}
}




/**
 * ISettingsWindowProps
 */
export interface ISettingsWindowProps extends IThemedAttributes {
	user?:User
	
}

export interface ISettingsWindowState {
	
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
	
	
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			
			.make()
	
	
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
	
	render() {
		const
			{ styles,theme,palette } = this.props,
			
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
					titleActionNodes={[createCancelButton(theme,palette,this.close)]}
					styles={styles.dialog}
				>
					<Tabs
						style={Fill}
						contentContainerStyle={Fill}
					  tabTemplate={TabTemplate}
					>
						<Tab
							iconStyle={styles.tabs.icon}
							icon={<FontIcon className="fa fa-globe"/> }
							style={FillHeight}
						>
						{/*</Tab>*/}
					
						{/**/}
						{/**/}
					{/*<Tab*/}
						{/*iconStyle={styles.tabs.icon}*/}
						{/*icon={<FontIcon className="material-icons">color_lens</FontIcon> }*/}
						{/*style={FillHeight}*/}
					{/*>*/}
					
						<form name="themeForm" style={styles.form}>
							<div style={styles.form.content}>
								<div style={styles.form.title}>
									Change your Theme and Palette
								</div>
								<div style={styles.form.row}>
									<div style={styles.form.inputCell}>
										<Select items={themeItems}
										        onSelect={this.changeTheme}
										        value={themeName} />
									</div>
									<div style={styles.form.labelCell}>
										Select an alternate theme
									</div>
								</div>
								
								
								<div style={styles.form.row}>
									<div style={styles.form.inputCell}>
										<Select items={paletteItems}
										        onSelect={this.changePalette}
										        value={paletteName} />
									</div>
									<div style={styles.form.labelCell}>
										Select an alternate palette
									</div>
								</div>
							</div>
						</form>
					</Tab>
			</Tabs>
			
			
			
			</DialogRoot>
		</CommandRoot>
	}
	
}


export default SettingsWindow