/**
 * Global CSS
 */
require('assets/fonts/fonts.global.scss')
require('styles/split-pane.global.scss')


// Logger
const log = getLogger(__filename)

//region Imports
import * as injectTapEventPlugin from 'react-tap-event-plugin'
import * as React from 'react'
import * as _ from 'lodash'
import {Provider, connect} from 'react-redux'
const {HotKeys} = require('react-hotkeys')

import {MuiThemeProvider} from "material-ui/styles"

import {PureRender} from 'ui/components/common'
import {IssueEditDialog} from 'components/issues/IssueEditDialog'
import {Header, HeaderVisibility, ToastMessages} from 'components'
import {getStore,getDevTools} from 'shared/store/AppStore'
import {getPage} from 'components/pages'
import {AppActionFactory} from 'shared/actions'
import {AppStateType} from 'shared'
import {Events,AppKey, RepoKey} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'
//endregion

try {
	injectTapEventPlugin()
} catch (err) {
	log.info('Failed to inject tap event handler = HMR??')
}


// Build the container

const store = getStore()
const appActions = new AppActionFactory()


//region DEBUG Components/Vars
//const AllDevTools = (DEBUG) ? require('components/debug/DevTools.tsx') : {}
const DevTools = getDevTools() || <div></div>
let devToolsRef = null
let appElement = null
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
	//adjustedBodyStyle:any
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
		hasAvailableRepos: availableRepos && availableRepos.size > 0,
		//adjustedBodyStyle: getAdjustedBodyStyle(this)
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
			appActions.newIssue()
		},

		[KeyMaps.CommonKeys.Edit]: () => {
			log.info('Edit issue keys pressed - making dialog visible')
			appActions.editIssue()
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
		const {hasAvailableRepos, stateType, theme} = this.props,
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


		return (
			<MuiThemeProvider muiTheme={theme}>
				<Provider store={store.getReduxStore()}>
					<HotKeys keyMap={KeyMaps.App} handlers={this.keyHandlers}>
						<IssueEditDialog />

						{/* Global flex box */}
						<div className="fill-height fill-width"
						     style={makeStyle(styles.content,theme.app)}>

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

//let rendered = false

function render() {
	const state = store.getState()

	// const appState = appActions.state
	const props = mapStateToProps(state)
	appElement = <App
		store={store.getReduxStore()}
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






