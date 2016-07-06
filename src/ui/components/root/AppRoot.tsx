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
import {Events,AppKey, RepoKey} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'

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


/**
 * Mape store state to props
 *
 * @param state
 */
function mapStateToProps(state) {
	const
		appState = state.get(AppKey),
		{availableRepos} = state.get(RepoKey)

	const dialogOpen = !_.isNil(appState.dialogs.find(dialogIsOpen => dialogIsOpen === true))

	return {
		theme: getTheme(),//appState.theme,
		stateType: appState.stateType,
		hasAvailableRepos: availableRepos && availableRepos.size > 0,
		dialogOpen
		//adjustedBodyStyle: getAdjustedBodyStyle(this)
	}
}

/**
 * Root App Component
 */
@AutoWired
@connect(mapStateToProps)
@PureRender
class App extends React.Component<IAppProps,any> {


	appActions:AppActionFactory
	repoActions:RepoActionFactory

	pageBodyHolder

	constructor(props, context) {
		super(props, context)

		this.appActions = Container.get(AppActionFactory)
		this.repoActions = Container.get(RepoActionFactory)
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
				<Provider store={store.getReduxStore()}>
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






