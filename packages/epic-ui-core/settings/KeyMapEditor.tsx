// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender, KeyboardAccelerator, FormButton, Button, TextField } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { isDefined, getValue } from "typeguard"
import { CommandAccelerator } from "epic-command-manager/CommandAccelerator"
import { SettingsSection, SettingsField } from "./SettingsElements"
import { makeWidthConstraint } from "epic-styles/styles"
import { getUIActions, getAppActions } from "epic-typedux/provider"
import { customAcceleratorsSelector } from "epic-typedux/selectors"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexColumn, Styles.FlexAuto, {
		
		accelerator: [ Styles.makePaddingRem(0.5, 1), {
			borderRadius: rem(0.3),
			color: text.primary,
			border: `0.1rem solid ${accent.hue1}`,
			backgroundColor: Styles.Transparent,
			fontWeight: 700,
			
			custom: [ {
				backgroundColor: accent.hue1
			} ]
		} ],
		
		reset: [ Styles.FlexRowCenter, Styles.PositionRelative, makeWidthConstraint(rem(10)), {
			button: [ Styles.FillWidth ]
		} ]
	} ]
}


/**
 * IKeyMapEditorProps
 */
export interface IKeyMapEditorProps extends IThemedAttributes {
	customAccelerators?:Map<string,string>
}

/**
 * IKeyMapEditorState
 */
export interface IKeyMapEditorState {
	filterText?:string
}


/**
 * KeyMapEditor
 *
 * @class KeyMapEditor
 * @constructor
 **/

@connect(createStructuredSelector({
	customAccelerators: customAcceleratorsSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class KeyMapEditor extends React.Component<IKeyMapEditorProps,IKeyMapEditorState> {
	
	
	private captureAccelerator = (cmd:ICommand) => {
		getUIActions().openSheet(getRoutes().CaptureAccelerator.uri, {
			commandId: cmd.id
		})
	}
	
	private onFilterChange = (event:React.FormEvent<any>) => {
		const
			filterText = (event.target as any).value
		
		this.setState({
			filterText
		})
	}
	
	/**
	 * Clear a custom accelerator
	 *
	 * @param cmd
	 */
	private clearAccelerator(cmd:ICommand) {
		getAppActions().setCustomAccelerator(cmd.id, null)
	}
	
	/**
	 * Render the list
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ customAccelerators, styles } = this.props,
			{ filterText } = this.state
		
		if (DEBUG) {
			log.debug(`Custom accelerators`, customAccelerators.toJS())
		}
		
		const
			title = <div style={makeStyle(Styles.FlexRowCenter,Styles.FlexScale)}>
				<div style={Styles.FlexScale}>Shortcuts</div>
				<TextField
					onChange={this.onFilterChange}
					defaultValue=''
					placeholder='filter...'/>
			</div>
		
		return <div style={styles.root}>
			<SettingsSection
				styles={styles}
				iconName="keyboard"
				iconSet="material-icons"
				title={title}>
				
				{CommandRegistryScope.all()
					.filter(cmd =>
						isDefined(cmd.defaultAccelerator) &&
						(
							getValue(() => filterText.length, 0) < 1 ||
							cmd.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1
						)
					)
					.map((cmd) => {
						const
							customAccelerator = customAccelerators.get(cmd.id),
							accelerator = new CommandAccelerator(customAccelerator || cmd.defaultAccelerator)
						
						if (customAccelerator)
							log.debug(`Custom "${cmd.name}" mapped to accelerator: ${customAccelerator}, parsed as ${accelerator.toElectronAccelerator()}`)
						
						return <SettingsField key={cmd.id} styles={styles} label={cmd.name}>
							<div style={[Styles.FlexRow,Styles.makeFlexAlign('center','flex-end')]}>
								
								<KeyboardAccelerator
									style={makeStyle(styles.accelerator,customAccelerator && styles.accelerator.custom)}
									accelerator={accelerator}/>
								
								<Button
									style={Styles.makeMarginRem(0,0,0,1.5)}
									onClick={() => this.captureAccelerator(cmd)}>
									SET
								</Button>
								
								<div style={styles.reset}>
									{customAccelerator &&
									<Button
										style={styles.reset.button}
										mode="warn"
										onClick={() => this.clearAccelerator(cmd)}>reset</Button>
									}
								</div>
							</div>
						
						</SettingsField>
					})}
			
			</SettingsSection>
		
		</div>
	}
	
}


