// Imports

import { SearchField } from "epic-ui-components/search"
import { PureRender } from "epic-ui-components/common"
import { getUIActions } from "epic-typedux"
import { getValue, guard } from "epic-global"
import { ThemedStyles } from "epic-styles"

import { RepoSearchProvider, GitHubSearchProvider } from "epic-ui-components/search/DefaultSearchProviders"

// Constants
const
	log = getLogger(__filename),
	RepoAddSearchId = 'repo-add-search'

const baseStyles = createStyles((topStyles, theme, palette) => {
	const
		{ primary, text, accent, secondary } = palette
	
	return {}
})


/**
 * IIssueEditDialogProps
 */
export interface IRepoAddToolProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	open?:boolean
}

export interface IRepoAddToolState {
	
	searchField?:any
}

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/

@ThemedStyles(baseStyles, 'dialog', 'repoAddDialog', 'sheet')
@PureRender
export class RepoAddTool extends React.Component<IRepoAddToolProps,IRepoAddToolState> {
	
	
	/**
	 * Hide the repo add panel
	 */
	hide = () => {
		getUIActions().closeSheet()
	}
	
	
	/**
	 * When a result is selected
	 *
	 * @param item
	 */
	onItemSelected = (item:ISearchItem) => {
		log.info(`Repo add result was selected`, item)
		
		guard(() => item.provider.handleItem(item))
		
		this.hide()
	}
	
	/**
	 * Sets a reference to the search panel
	 *
	 * @param searchField
	 */
	setSearchField = (searchField) => {
		log.info(`Got search panel`, searchField)
		//, () => this.setFocused()
		this.setState({ searchField })
		
	}
	
	/**
	 * Helper to get search panel
	 */
	get searchField() {
		
		return getValue(() => this.state.searchField, null)
	}
	
	
	/**
	 * Create a new state
	 *
	 * @param props
	 * @returns {{styles: any}}
	 */
	getNewState(props:IRepoAddToolProps) {
		
		return {}
		
	}
	
	/**
	 * On new props - update the state
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps = (nextProps:IRepoAddToolProps) => this.setState(this.getNewState(nextProps))
	
	
	/**
	 * on mount update state
	 */
	componentWillMount = () => this.setState(this.getNewState(this.props))
	
	
	render() {
		
		const
			{ styles } = this.props
		
		
		return <div
			style={[FlexColumn]}>
			
			<SearchField ref={this.setSearchField}
			             inputStyle={styles.search.input}
			             style={styles.search.panel}
			             autoFocus={true}
			             tabIndex={-1}
			             onEscape={this.hide}
			             focused={true}
			             open={true}
			             resultsHidden={false}
			             searchId={RepoAddSearchId}
			             providers={[
			             	RepoSearchProvider,
			             	GitHubSearchProvider
		               ]}
			             onItemSelected={this.onItemSelected}
			             hidden={false}/>
		
		</div>
	}
	
}

