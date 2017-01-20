// Imports
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { PureRender, IconButton } from "epic-ui-components"
import { IThemedAttributes, ThemedStyles, colorLighten } from "epic-styles"
import { SettingsSection } from "./SettingsElements"
import { pluginDirectoriesSelector } from "epic-typedux"
import { pluginDefaultPath } from "epic-global"
import { PluginManager } from "epic-plugin-manager"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette,
		resetWidth = rem(10)
	
	return [ Styles.FlexColumn, Styles.FlexAuto, {
		
		pluginDirectories: [ Styles.makeMarginRem(0, 1.5), Styles.makePaddingRem(0.5, 0.5), {
			border: `1px solid ${primary.hue3}`,
			background: primary.hue1,
			directory: [ Styles.FlexRowCenter, Styles.makePaddingRem(0.5, 1) ],
			"default": [ {
				color: colorLighten(primary.hue3, 20)
			} ]
		} ],
		
		
	} ]
}


/**
 * IPluginConfigEditorProps
 */
export interface IPluginConfigEditorProps extends IThemedAttributes {
	pluginDirectories?:string[]
}

/**
 * IPluginConfigEditorState
 */
export interface IPluginConfigEditorState {
}


/**
 * PluginConfigEditor
 *
 * @class PluginConfigEditor
 * @constructor
 **/

@connect(createStructuredSelector({
	pluginDirectories: pluginDirectoriesSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class PluginConfigEditor extends React.Component<IPluginConfigEditorProps,IPluginConfigEditorState> {
	
	private showDirectoryPicker = () => {
		const
			{ dialog } = require('electron').remote,
			newDirs = dialog.showOpenDialog({ properties: [ 'openDirectory', 'multiSelections' ] })
		
		
		log.debug(`Adding new directories for plugins`, newDirs)
		PluginManager.addDirectory(...newDirs)
		
	}
	
	/**
	 * Render the list
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ pluginDirectories, styles } = this.props
		
		const
			title = <div style={makeStyle(Styles.FlexRowCenter, Styles.FlexScale)}>
				<div style={Styles.FlexScale}>Plugin Directories</div>
				<IconButton
					onClick={this.showDirectoryPicker}
					iconName="add"/>
				<div style={styles.filterSpacer}/>
			</div>
		
		return <div style={styles.root}>
			<SettingsSection
				styles={styles}
				iconName="folder"
				iconSet="material-icons"
				title={title}>
				
				<div style={styles.pluginDirectories}>
					{pluginDirectories.map(dir => <div style={[ styles.pluginDirectories.directory ]} key={dir}>
						<div style={[ Styles.FlexScale, Styles.Ellipsis ]}>{dir}</div>
						<div style={[ Styles.FlexAuto ]}>
							{pluginDefaultPath !== dir ?
								<IconButton
									onClick={() => PluginManager.removeDirectory(dir)}
									iconSet="material-icons" iconName="delete"/> :
								<span style={styles.pluginDirectories.default}>DEFAULT</span>}
						</div>
					</div>)
					}
				</div>
			</SettingsSection>
		
		</div>
	}
	
}

