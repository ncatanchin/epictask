// Imports
import * as React from 'react'
import {connect} from 'react-redux'

import {SearchPanel} from 'ui/components/search'
import {Dialogs} from 'shared/config/DialogsAndSheets'
import {PureRender} from 'ui/components/common/PureRender'
import {SearchType} from 'shared/actions/search/SearchState'
import { uiStateSelector } from "shared/actions/ui/UISelectors"
import { getUIActions } from "shared/actions/ActionFactoryProvider"
import { getValue } from "shared/util/ObjectUtil"
import { ThemedStyles } from "shared/themes/ThemeDecorations"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles((topStyles,theme,palette) => {
	const
		{primary,text,accent,secondary} = palette
	
	return {
		root: [ makeTransition([ 'opacity' ]), {
			// position: 'fixed',
			// left: 0,
			// right: 0,
			// top: 0,
			// bottom: 0,
			//pointerEvents: 'none',
			opacity: 0,
			zIndex: 99999,
			
			// open: {
			// 	opacity: 1,
			// 	pointerEvents: 'auto'
			// }
		} ],
		
		container: [ PositionAbsolute, {
			borderRadius: '0.5rem',
			maxHeight: '80%',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%,-50%)',
			width: '70%',
			overflow: 'hidden'
		} ],
		
		search: {
			panel: [{
				backgroundColor: Transparent
			}],
			
			underline: [{
				transform: 'scaleX(1)',
				borderBottom: `0.1rem solid ${accent.hue1}`,
				borderBottomColor: accent.hue1,
				bottom: '0px'
			}],
			
			field: [{
				height: rem(3.6),
				backgroundColor: Transparent,
				color: primary.hue1,
			}],
			
			input: [makePaddingRem(0,1),{
				fontWeight: 500,
				color: accent.hue1,
				backgroundColor: Transparent
			}],
			
			hint: [makePaddingRem(0,1),{
				marginBottom: -6,
				fontWeight: 300,
				color: accent.hue2,
				backgroundColor: Transparent
			}],
		}
		
		
		
	}
})


function mapStateToProps(state) {
	const
		uiState = uiStateSelector(state),
		open = uiState.dialogs.get(Dialogs.RepoAddTool)

	return {
		open
	}
}

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

	
@connect(mapStateToProps)
@ThemedStyles(baseStyles,'dialog','repoAddDialog')
@PureRender
export class RepoAddTool extends React.Component<IRepoAddToolProps,IRepoAddToolState> {
	
	
	/**
	 * Hide the repo add panel
	 */
	hide = () => {
		getUIActions().closeSheet()
	}
	
	componentDidUpdate(prevProps,prevState) {
		//this.setFocused()
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
	 * Whenever we get results changed, we adjust the size
	 *
	 * @param items
	 */
	onResultsChanged = (items) => {
		// const
		// 	count = Math.min(items.length,6),
		// 	win = require('electron').remote.getCurrentWindow()
		//
		// win.setSize(win.getSize()[0], (count + 1) * 48,true)
		//
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
	 * When the panel is focused we focus on the search field
	 */
	setFocused = () => {
		
		
		if (this.searchPanel) {
			const
				elem = this.searchPanel.getWrappedInstance()
			
			// debugger
			// elem.updateFocus()
		}
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
			{theme,styles} = this.props,
			rootStyles = mergeStyles(
				styles.root,
				this.props.open && styles.root.open
			)

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
			             onResultsChanged={this.onResultsChanged}
			             onResultSelected={this.onResultSelected}
						       hidden={false}/>
			
		</div>
	}

}

