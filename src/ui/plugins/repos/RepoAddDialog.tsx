// Imports
import * as React from 'react'
import {connect} from 'react-redux'

import {SearchPanel} from 'ui/components/search'
import {Dialogs} from 'shared/UIConstants'
import * as KeyMaps from 'shared/KeyMaps'
import {PureRender} from 'ui/components/common/PureRender'

import {MuiThemeProvider} from 'material-ui/styles'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {SearchType} from 'shared/actions/search/SearchState'
import {ThemedNoRadium} from 'shared/themes/ThemeManager'
import { uiStateSelector } from "shared/actions/ui/UISelectors"
import { getRepoActions, getAppActions } from "shared/actions/ActionFactoryProvider"

// Constants
const log = getLogger(__filename)
const uiActions = Container.get(UIActionFactory)

const baseStyles = createStyles({
	root: [makeTransition(['opacity']),{
		position: 'fixed',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		pointerEvents: 'none',
		opacity: 0,
		zIndex: 99999,

		open: {
			opacity: 1,
			pointerEvents: 'auto'
		}
	}],

	container: [PositionAbsolute,{
		borderRadius: '0.5rem',
		maxHeight: '80%',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%,-50%)',
		width: '70%',
		overflow: 'hidden'
	}],

	input: {
		fontWeight: 700
	},



})


function mapStateToProps(state) {
	const
		uiState = uiStateSelector(state),
		open = uiState.dialogs.get(Dialogs.RepoAddDialog)

	return {
		open
	}
}

/**
 * IIssueEditDialogProps
 */
export interface IRepoAddDialogProps extends React.HTMLAttributes<any> {
	theme?:any
	open?:boolean
}

export interface IRepoAddDialogState {
	styles?:any
	searchPanel?:any
}

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/


@connect(mapStateToProps)
@ThemedNoRadium
@PureRender
export class RepoAddDialog extends React.Component<IRepoAddDialogProps,IRepoAddDialogState> {

	get appActions() {
		return getAppActions()
	}
	
	get repoActions() {
		return getRepoActions()
	}
	

	constructor(props, context) {
		super(props, context)

	}

	keyHandlers = {
		[KeyMaps.CommonKeys.Escape]: () => {
			log.info('Hiding Search')
			this.hide()
		}
	}

	/**
	 * Hide the repo add panel
	 */
	hide = () => {
		uiActions.setDialogOpen(Dialogs.RepoAddDialog,false)
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
		const
			count = Math.min(items.length,6),
			win = require('electron').remote.getCurrentWindow()
		
		win.setSize(win.getSize()[0], (count + 1) * 48,true)
		
	}
	
	/**
	 * Sets a reference to the search panel
	 *
	 * @param searchPanel
	 */
	setSearchPanel = (searchPanel) => {
		this.setState({searchPanel})
		this.setFocused()
	}

	/**
	 * When the panel is focused we focus on the search field
	 */
	setFocused = () => {
		const searchPanel = _.get(this,'state.searchPanel') as any
		// if (searchPanel && this.props.open) {
		// 	const elem = searchPanel.getWrappedInstance()
		// 	elem.updateFocus()
		// }
	}

	getNewState(props:IRepoAddDialogProps) {
		const
			{theme,open} = props,
			styles = mergeStyles(
				baseStyles,
				theme && theme.dialog,
				theme && theme.repoAddDialog
			)

		return {styles}

	}

	/**
	 * On new props - update the state
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps =(nextProps:IRepoAddDialogProps) => this.setState(this.getNewState(nextProps)) || this.setFocused()


	/**
	 * on mount update state
	 */
	componentWillMount = () => this.setState(this.getNewState(this.props)) || this.setFocused()



	render() {

		const {styles} = this.state,
			{theme} = this.props,
			rootStyles = mergeStyles(
				styles.root,
				this.props.open && styles.root.open
			)

		return <MuiThemeProvider muiTheme={theme}>
			<div style={[styles.container]}>
				<SearchPanel ref={this.setSearchPanel}
				             autoFocus={true}
				             modal={true}
				             onEscape={this.hide}
				             open={this.props.open}
				             resultsHidden={!this.props.open}
				             searchId='repo-add-search'
				             types={[SearchType.Repo]}
				             inlineResults={true}
				             expanded={false}
				             mode='repos'
				             onResultsChanged={this.onResultsChanged}
				             onResultSelected={this.onResultSelected}
							       hidden={!open}/>
			</div>
		</MuiThemeProvider>
	}

}

export default RepoAddDialog