import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
/**
 * Global CSS
 */
require('assets/fonts/fonts.global.scss')
require('styles/split-pane.global.scss')


// Logger
const log = getLogger(__filename)

import {AutoWired,Container} from 'typescript-ioc'

//region Imports
import {ObservableStore} from 'typedux'
import * as Radium from 'radium'
import * as injectTapEventPlugin from 'react-tap-event-plugin'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Provider, connect} from 'react-redux'
import {MuiThemeProvider} from "material-ui/styles"

import {PureRender} from '../common'
import {IssueEditDialog} from '../issues/IssueEditDialog'
import {RepoAddDialog} from '../repos/RepoAddDialog'
import {Header, HeaderVisibility, ToastMessages} from 'components'
import {getPage} from 'components/pages'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {AppStateType} from 'shared/AppStateType'
import {Events, AppKey, RepoKey, UIKey} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'
import {RepoState} from 'shared/actions/repo/RepoState'
import {AppState} from 'shared/actions/AppState'
import {UIState} from 'shared/actions/ui/UIState'
import {createAvailableRepoCountSelector} from 'shared/actions/repo/RepoSelectors'

const {StyleRoot} = Radium
const {HotKeys} = require('react-hotkeys')
//endregion

try {
	injectTapEventPlugin()
} catch (err) {
	log.info('Failed to inject tap event handler = HMR??')
}


// Build the container
const store = Container.get(ObservableStore)


//region DEBUG Components/Vars
//const AllDevTools = (DEBUG) ? require('components/debug/DevTools.tsx') : {}
// const DevTools = getDevTools() || <div></div>
const DevTools = <div/>
let devToolsRef = null
let appElement = null
let reduxStore = null
//endregion


//region Styles
const styles = {
	app: makeStyle(FlexColumn, FlexScale, {
		overflow: 'hidden'
	}),

	header: makeStyle(makeTransition(), FlexRowCenter, {}),

	content: makeStyle(makeTransition(), FlexColumn, PositionRelative, {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1
	}),

	collapsed: makeStyle({flexGrow: 0})


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
	dialogOpen:boolean
	//adjustedBodyStyle:any
}


const availRepoCountSelector = createAvailableRepoCountSelector()

function mapStateToProps(state:any,props:IAppProps = {} as any) {
	const
		appState = state.get(AppKey) as AppState,
		uiState = state.get(UIKey) as UIState

	const dialogOpen = !_.isNil(uiState.dialogs.find(dialogIsOpen => dialogIsOpen === true))

	return {
		theme:      getTheme(),
		hasAvailableRepos:availRepoCountSelector(state) > 0,
		stateType: appState.stateType,
		dialogOpen
	}



}

//
//
// /**
//  * Mape store state to props
//  *
//  * @param state
//  */
// function mapStateToProps(state) {
// 	const
// 		appState = state.get(AppKey) as AppState,
// 		uiState = state.get(UIKey) as UIState,
// 		{availableRepos} = state.get(RepoKey) as RepoState
//
// 	const dialogOpen = !_.isNil(uiState.dialogs.find(dialogIsOpen => dialogIsOpen === true))
//
// 	return {
// 		theme: getTheme(),//appState.theme,
// 		stateType: appState.stateType,
// 		hasAvailableRepos: availableRepos && availableRepos.size > 0,
// 		dialogOpen
// 		//adjustedBodyStyle: getAdjustedBodyStyle(this)
// 	}
// }

/**
 * Root App Component
 */
@connect(mapStateToProps)
@PureRender
class App extends React.Component<IAppProps,any> {


	appActions = Container.get(AppActionFactory)
	repoActions = Container.get(RepoActionFactory)
	uiActions = Container.get(UIActionFactory)

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
			this.repoActions.newIssue()
		},

		[KeyMaps.CommonKeys.Edit]: () => {
			log.info('Edit issue keys pressed - making dialog visible')
			this.repoActions.editIssue()
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
		//adjustedBodyStyle
		const {hasAvailableRepos, stateType,dialogOpen, theme} = this.props,
			{palette} = theme

		const page = {component: getPage(stateType)},
			expanded = stateType > AppStateType.AuthLogin && !hasAvailableRepos

		const headerVisibility = (stateType < AppStateType.Home) ?
			HeaderVisibility.Hidden :
			(expanded) ? HeaderVisibility.Expanded :
				HeaderVisibility.Normal

		//region Create Themed Styles
		const contentStyles = makeStyle(styles.content, {
			backgroundColor: palette.canvasColor,
			display: 'flex',
			flexDirection: 'column'
		}, expanded && styles.collapsed)
		//endregion

		let rootClasses = 'fill-height fill-width root-content'
		if (dialogOpen)
			rootClasses += ' dialog-open'

		return (

			<MuiThemeProvider muiTheme={theme}>
				<Provider store={reduxStore}>
					<HotKeys keyMap={KeyMaps.App} handlers={this.keyHandlers}>
						<IssueEditDialog />
						<RepoAddDialog />

						{/* Global flex box */}
						<div className={rootClasses}
						     style={makeStyle(styles.content,theme.app)}>

							<Header visibility={headerVisibility}/>

							<HotKeys ref={(c) => this.pageBodyHolder = c}
							         style={makeStyle(FlexScale,FlexColumn)}>

								<div style={contentStyles}>
									<page.component />
								</div>

								{/* DevTools */}
								{/*<DevTools ref={(c) => devToolsRef = c}/>*/}
								<ToastMessages/>
							</HotKeys>

						</div>
					</HotKeys>
				</Provider>
			</MuiThemeProvider>


		)
	}
}

//let rendered = false

function render() {
	reduxStore = store.getReduxStore()
	const state = store.getState()

	// const appState = appActions.state
	const props = mapStateToProps(state)
	appElement = <App
		store={reduxStore}
		{...props}
	/>
	ReactDOM.render(
		appElement,
		document.getElementById('root'),
		() => {
			log.info('Rendered, hiding splash screen')
			window.postMessage({type:Events.UIReady},"*")
		}
	)
}

/**
 * Make sure the whole front end is loaded and the backend
 * is ready for us to load everything
 */
function checkIfRenderIsReady() {
	const state = store.getState()
	const appState = state ? state.get(AppKey) : null
	const ready = appState ? appState.ready : false

	if (!ready) {
		log.info('Theme is not set yet')
		const observer = store.observe([AppKey,'ready'],(newReady) => {
			log.info('RECEIVED READY, NOW RENDER',newReady)
			if (!newReady !== true) {
				log.info('Main is not ready',newReady)
				return
			}
			observer()
			render()
		})
	} else {
		render()
	}
}

checkIfRenderIsReady()


/**
 * Enable HMR
 */
if (module.hot) {
	module.hot.accept()
	module.hot.dispose(() => {
		log.info('HMR - App Root Disposed')
	})
}






