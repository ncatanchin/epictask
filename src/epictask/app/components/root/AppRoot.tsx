/**
 * Global CSS
 */
require('assets/fonts/fonts.global.scss')
require('styles/split-pane.global.scss')


// Logger
const log = getLogger(__filename)

//region Imports
import * as React from 'react'
import * as _ from 'lodash'
import {Provider, connect} from 'react-redux'
const {HotKeys} = require('react-hotkeys')

import {MuiThemeProvider} from "material-ui/styles"
import {Snackbar} from 'material-ui'
import {PureRender} from 'components/common'
import {IssueEditDialog} from 'components/issues/IssueEditDialog'
import {Header,HeaderVisibility,ToastMessages} from 'components'
import {getStore} from 'app/store/AppStore'
import {getPage} from 'components/pages'
import {AppActionFactory} from 'app/actions'
import {AppStateType} from 'shared'
import {AppKey, RepoKey} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'
//endregion




// Build the container

const store = getStore()
const appActions = new AppActionFactory()


//region DEBUG Components/Vars
const DevTools = (DEBUG) ? require('components/debug/DevTools.tsx') : <div></div>
let devToolsRef = null
let appElement = null
let monitorStateSubscribed = false
let monitorStatePrevious = null
//endregion



//region Styles
const styles = {
	app: makeStyle(FlexColumn,FlexScale,{
		overflow: 'hidden'
	}),

	header: makeStyle(makeTransition(), FlexRowCenter, {

	}),

	content: makeStyle(makeTransition(), FlexColumn, PositionRelative, {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1
	}),

	collapsed: makeStyle({flexGrow: 0})


}
//endregion

//region Monitor State Layout Adjustment
/**
 * Calculates an adjusted style in DEBUG when the monitor is
 * visible so that the full body can be seen
 *
 * @param connectInstance
 * @returns {any}
 */
function getAdjustedBodyStyle(connectInstance:any) {
	const store = (connectInstance) ? connectInstance.store : {}
	const {liftedStore} = store
	if (!DEBUG || !liftedStore)
		return {}

	const {monitorState} = liftedStore.getState()
	let bodyStyle:any = {
		maxWidth: '100%',
		minWidth: '100%',
		maxHeight: '100%',
		minHeight: '100%'
	}

	if (monitorState && !monitorStateSubscribed) {
		monitorStateSubscribed = true
		liftedStore.subscribe(_.debounce(function() {
			const newMonitorState = _.pick(liftedStore.getState().monitorState,'isVisible','position')
			if (_.isEqual(monitorStatePrevious, newMonitorState) || _.isEqual(appActions.state.monitorState, newMonitorState)) {
				// no change
			} else if (!appElement) {
				log.debug('monitor state changed, but no app element yet')
			} else {
				monitorStatePrevious = newMonitorState
				appActions.setMonitorState(newMonitorState)
			}
		},500))
	}

	if (devToolsRef && monitorState && monitorState.isVisible) {
		const elem = (ReactDOM.findDOMNode(devToolsRef) as any).children[0]
		const {position} = monitorState

		const
			maxHeight = window.innerHeight - elem.clientHeight,
			maxWidth = window.innerWidth - elem.clientWidth

		bodyStyle = (position === 'top') ? {
			maxHeight,
			minHeight: maxHeight,
			marginTop: elem.clientHeight
		} : (position === 'bottom') ? {
			maxHeight,
			minHeight: maxHeight
		} : (position === 'right') ? {
			maxWidth,
			minWidth: maxWidth
		} : {
			maxWidth,
			minWidth: maxWidth,
			marginLeft: elem.clientWidth
		}

	}

	return bodyStyle
}
//endregion


/**
 * Properties for App/State
 */
export interface IAppProps {
	store:any
	theme:any
	stateType:AppStateType
	hasAvailableRepos:boolean
	adjustedBodyStyle:any
}


/**
 * Mape store state to props
 *
 * @param state
 */
function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const {availableRepos} = state.get(RepoKey)
	return {
		theme: getTheme(),//appState.theme,
		stateType: appState.stateType,
		hasAvailableRepos: availableRepos && availableRepos.length > 0,
		adjustedBodyStyle: getAdjustedBodyStyle(this)
	}
}

/**
 * Root App Component
 */
@connect(mapStateToProps)
@PureRender
class App extends React.Component<IAppProps,any> {

	pageBodyHolder

	constructor(props, context) {
		super(props, context)
	}


	/**
	 * Map hot keys for the root
	 *
	 * @type {{}}
	 */
	keyHandlers = {
		[KeyMaps.CommonKeys.New]: () => {
			log.info('New issue keys pressed - making dialog visible')
			appActions.setDialogOpen(IssueEditDialog.name,true)
		},
		[KeyMaps.CommonKeys.Escape]: () => {
			log.info('Escaping and moving focus')
			ReactDOM.findDOMNode<HTMLDivElement>(this.pageBodyHolder).focus()
		}
	}


	/**
	 * Render the app container
	 */
	render() {
		const {hasAvailableRepos,stateType,theme,adjustedBodyStyle} = this.props,
			{palette} = theme

		const page = {component: getPage(stateType)},
			expanded = stateType > AppStateType.AuthLogin && !hasAvailableRepos

		const headerVisibility = (stateType < AppStateType.Home) ? HeaderVisibility.Hidden :
				(expanded) ? HeaderVisibility.Expanded :
					HeaderVisibility.Normal

		//region Create Themed Styles
		const contentStyles = makeStyle(styles.content, {
			backgroundColor: palette.canvasColor,
			display: 'flex',
			flexDirection: 'column'
		},expanded && styles.collapsed)
		//endregion


		return (
			<MuiThemeProvider muiTheme={theme}>
				<Provider store={store.getReduxStore()}>
					<HotKeys keyMap={KeyMaps.App} handlers={this.keyHandlers}>
						<IssueEditDialog />

						{/* Global flex box */}
						<div className="fill-height fill-width"
						     style={makeStyle(styles.content,theme.app,adjustedBodyStyle)}>

							<Header visibility={headerVisibility}/>

							<HotKeys ref={(c) => this.pageBodyHolder = c}
							         style={makeStyle(FlexScale,FlexColumn)}>

								<div style={contentStyles}>
									<page.component />
								</div>

								{/* DevTools */}
								<DevTools ref={(c) => devToolsRef = c}/>
								<ToastMessages/>
							</HotKeys>

						</div>
					</HotKeys>
				</Provider>
			</MuiThemeProvider>

		)
	}
}


function render() {
	// const appState = appActions.state
	const props = mapStateToProps(store.getState())
	appElement = <App
		store={store.getReduxStore()}
		{...props}
	/>
	ReactDOM.render(
		appElement,
		document.getElementById('root')
	)
}

render()

if (module.hot) {
	module.hot.accept()
	module.hot.dispose(() => {
		log.info('HMR - App Root Disposed')
	})
}






