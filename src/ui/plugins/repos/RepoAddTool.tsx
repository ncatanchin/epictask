// Imports
import * as React from 'react'
import {SearchPanel} from 'ui/components/search'
import {PureRender} from 'ui/components/common/PureRender'
import {SearchType} from 'shared/actions/search/SearchState'
import { getUIActions } from "shared/actions/ActionFactoryProvider"
import { getValue } from "shared/util"
import { ThemedStyles } from "shared/themes/ThemeDecorations"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles((topStyles,theme,palette) => {
	const
		{primary,text,accent,secondary} = palette
	
	return {
		
	}
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
	
	searchPanel?:any
}

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/

@ThemedStyles(baseStyles,'dialog','repoAddDialog','sheet')
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
	 * @param result
	 */
	onResultSelected = (result) => {
		log.info(`Repo add result was selected`,result)
		this.hide()
	}
	
	/**
	 * Sets a reference to the search panel
	 *
	 * @param searchPanel
	 */
	setSearchPanel = (searchPanel) => {
		log.info(`Got search panel`,searchPanel)
		//, () => this.setFocused()
		this.setState({searchPanel})
		
	}
	
	/**
	 * Helper to get search panel
	 */
	get searchPanel() {
		
		return getValue(() => this.state.searchPanel,null)
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
	componentWillReceiveProps =(nextProps:IRepoAddToolProps) => this.setState(this.getNewState(nextProps))


	/**
	 * on mount update state
	 */
	componentWillMount = () => this.setState(this.getNewState(this.props))



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
			             autoFocus={true}
			             modal={true}
			             onEscape={this.hide}
			             open={true}
			             resultsHidden={false}
			             searchId='repo-add-search'
			             types={[SearchType.Repo]}
			             inlineResults={true}
			             expanded={false}
			             mode='repos'
			             onResultSelected={this.onResultSelected}
						       hidden={false}/>
			
		</div>
	}

}

