// Imports
import {AutoWired,Inject,Container} from 'typescript-ioc'
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {SearchPanel} from 'ui/components/search'
import * as Constants from 'shared/Constants'
import {Dialogs} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'
import {PureRender} from 'ui/components'

import {MuiThemeProvider} from 'material-ui/styles'
import {UIState} from 'shared/actions/ui/UIState'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {SearchType} from 'shared/actions/search/SearchState'
import {Themed, ThemedNoRadium} from 'shared/themes/ThemeManager'
const {Style} = Radium
const {HotKeys} = require('react-hotkeys')

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
	const uiState = state.get(Constants.UIKey) as UIState
	//const repoState = state.get(Constants.RepoKey) as RepoState

	const open = uiState.dialogs.get(Dialogs.RepoAddDialog)

	return {
		theme: getTheme(),
		open
	}
}

/**
 * IIssueEditDialogProps
 */
export interface IRepoAddDialogProps extends React.DOMAttributes {
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

@AutoWired
@connect(mapStateToProps)
@ThemedNoRadium
@PureRender
export class RepoAddDialog extends React.Component<IRepoAddDialogProps,IRepoAddDialogState> {

	@Inject
	appActions:AppActionFactory

	@Inject
	repoActions:RepoActionFactory

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
		const {state} = this
		const {searchPanel} = state || {} as any

		// if (searchPanel)
		// 	searchPanel.getWrapperInstance().blur()

		uiActions.setDialogOpen(Dialogs.RepoAddDialog,false)
	}

	/**
	 * When a result is selected
	 *
	 * @param result
	 */
	onResultSelected = (result) => this.hide()

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
			rootStyles = mergeStyles(styles.root,this.props.open && styles.root.open)

		return <div style={rootStyles}>
			<HotKeys handlers={this.keyHandlers} onFocus={this.setFocused} style={rootStyles}>
				{this.props.open && <MuiThemeProvider muiTheme={theme}>

						<div style={styles.container}>
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

							             onResultSelected={this.onResultSelected}
										 hidden={!open}/>
						</div>

				</MuiThemeProvider>}
			</HotKeys>
		</div>
	}

}