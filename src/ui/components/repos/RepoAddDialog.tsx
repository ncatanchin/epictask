/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import {AutoWired,Inject,Container} from 'typescript-ioc'
import * as React from 'react'
import {List} from 'immutable'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {AppState} from 'shared/actions/AppState'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {SearchPanel} from 'components'
import * as Constants from 'shared/Constants'
import {Dialogs} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'
import {PureRender, Renderers, Icon, Button, Avatar, LabelFieldEditor} from 'components'

import {MuiThemeProvider} from 'material-ui/styles'
import {UIState} from 'shared/actions/ui/UIState'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {SearchType} from 'shared/actions/search/SearchState'
const {Style} = Radium
const {HotKeys} = require('react-hotkeys')

// Constants
const log = getLogger(__filename)
const uiActions = Container.get(UIActionFactory)

const styles = createStyles({
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

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/

@AutoWired
@connect(mapStateToProps)
@Radium
@PureRender
export class RepoAddDialog extends React.Component<IRepoAddDialogProps,any> {

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


	hide = () => {
		const {state} = this
		const {searchPanel} = state || {} as any

		if (searchPanel)
			searchPanel.blur()

		uiActions.setDialogOpen(Dialogs.RepoAddDialog,false)
	}

	onResultSelected = (result) => this.hide()

	getNewState(props) {
		const
			{theme,open} = props,
			s = mergeStyles(
				styles,
				theme && theme.dialog,
				theme && theme.repoAddDialog
			)

		return {
			s
		}

	}

	componentWillReceiveProps(nextProps) {
		this.setState(this.getNewState(nextProps))
	}

	componentWillMount() {
		this.setState(this.getNewState(this.props))
	}


	render() {

		const
			{s} = this.state,
			{theme,open} = this.props,
			rootStyles = mergeStyles(s.root,open && s.root.open)



		return <div style={rootStyles}>

			<MuiThemeProvider muiTheme={theme}>
				<HotKeys handlers={this.keyHandlers}>
					<div style={s.container}>
						<SearchPanel searchId='repo-add-search'
						             types={[SearchType.Repo]}
						             inlineResults={true}
						             expanded={false}
						             mode='repos'
						             onResultSelected={this.onResultSelected}
									 hidden={!open}/>
					</div>
				</HotKeys>
			</MuiThemeProvider>
		</div>
	}

}