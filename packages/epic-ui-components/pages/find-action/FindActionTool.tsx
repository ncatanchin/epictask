// Imports
import { PureRender } from "epic-ui-components/common"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { getUIActions } from "epic-typedux"
import { getValue } from "epic-global"
import { SearchPanel } from "epic-ui-components/search"

import { ActionSearchProvider } from "epic-ui-components/search/DefaultSearchProviders"
import { SearchItem } from "epic-models"

// Constants
const
	log = getLogger(__filename),
	FindActionSearchId = 'find-action-search'

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
	hide = _.debounce(() => {
		getUIActions().closeSheet()
	},50)
	
	/**
	 * On search result selected
	 * @param eventType
	 * @param searchId
	 * @param item
	 */
	private onResultSelected = _.debounce((eventType,searchId:string,item:SearchItem) => {
		if (searchId !== FindActionSearchId || !getValue(() => item.provider.id === 'Action',false))
			return
		
		item.provider.handleItem(item)
		
		this.hide()
	},100)
	
	/**
	 * On mount create initial state & bind listeners
	 */
	componentWillMount = () => {
		EventHub.on(EventHub.SearchItemSelected,this.onResultSelected)
	}
	
	/**
	 * On unmount - unbind
	 */
	componentWillUnmount = () => {
		EventHub.off(EventHub.SearchItemSelected,this.onResultSelected)
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
			             allowEmptyQuery={true}
			             autoFocus={true}
			             perProviderLimit={-1}
			             onEscape={this.hide}
			             open={true}
			             focused={true}
			             placeholder={FindActionSearchId}
			             resultsHidden={false}
			             searchId='find-action-search'
			             providers={[ActionSearchProvider]}
			             hidden={false}/>
		
		</div>
	}
}