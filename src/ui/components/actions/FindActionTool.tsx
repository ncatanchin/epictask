// Imports
import { PureRender } from 'ui/components/common/PureRender'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { IThemedAttributes } from "shared/themes/ThemeDecorations"
import { getUIActions } from "shared/actions/ActionFactoryProvider"
import { getValue } from "shared/util"
import { SearchType } from "shared/actions/search"
import { SearchPanel } from "ui/components/search"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexColumn, FlexAuto, {} ]
}


/**
 * IFindActionToolProps
 */
export interface IFindActionToolProps extends IThemedAttributes {
}

/**
 * IFindActionToolState
 */
export interface IFindActionToolState {
	searchPanel?:any
}

/**
 * FindActionTool
 *
 * @class FindActionTool
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'sheet')
@PureRender
export class FindActionTool extends React.Component<IFindActionToolProps,IFindActionToolState> {
	/**
	 * Hide the repo add panel
	 */
	hide = () => {
		getUIActions().closeSheet()
	}
	
	
	/**
	 * When a result is selected
	 *
	 * @param result
	 */
	onResultSelected = (result) => {
		log.debug(`Action result was selected`,result)
		this.hide()
	}
	
	/**
	 * Sets a reference to the search panel
	 *
	 * @param searchPanel
	 */
	setSearchPanel = (searchPanel) => {
		log.debug(`Got search panel`,searchPanel)
		this.setState({searchPanel})
		
	}
	
	/**
	 * Helper to get search panel
	 */
	get searchPanel() {
		return getValue(() => this.state.searchPanel,null)
	}
	
	
	render() {
		
		const
			{styles} = this.props
		
		
		return <div
			style={[FlexColumn]}>
			
			<SearchPanel ref={this.setSearchPanel}
			             inputStyle={styles.search.input}
			             panelStyle={styles.search.panel}
			             fieldStyle={styles.search.field}
			             hintStyle={styles.search.hint}
			             underlineStyle={styles.search.underline}
			             allowEmptyQuery={true}
			             autoFocus={true}
			             modal={true}
			             perSourceLimit={-1}
			             onEscape={this.hide}
			             open={true}
			             hint='Execute an Epic action'
			             resultsHidden={false}
			             searchId='find-action-search'
			             types={[SearchType.Action]}
			             inlineResults={true}
			             expanded={false}
			             mode='actions'
			             onResultSelected={this.onResultSelected}
			             hidden={false}/>
		
		</div>
	}
}