import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {ObservableStore} from 'typedux'
import * as Radium from 'radium'
import * as injectTapEventPlugin from 'react-tap-event-plugin'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Provider, connect} from 'react-redux'
import {MuiThemeProvider} from 'material-ui/styles'
import {PureRender} from '../common'
import {IssueEditDialog} from '../issues/IssueEditDialog'
import {RepoAddDialog} from '../repos/RepoAddDialog'
import {Header, HeaderVisibility, ToastMessages} from 'components'
import {getPage} from 'components/pages'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {AppStateType} from 'shared/AppStateType'
import {Events, AppKey, UIKey} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'
import {AppState} from 'shared/actions/AppState'
import {UIState} from 'shared/actions/ui/UIState'
import {availableRepoCountSelector} from 'shared/actions/repo/RepoSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {RootState} from 'shared/store/RootState'
import {HotKeys} from 'react-hotkeys'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {Themed} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'

const {StyleRoot} = Radium
const $ = require('jquery')


/**
 * Global CSS
 */
require('assets/fonts/fonts.global.scss')
require('styles/split-pane.global.scss')


// Logger
const log = getLogger(__filename)

try {
	injectTapEventPlugin()
} catch (err) {
	log.info('Failed to inject tap event handler = HMR??')
}


// Build the container
const store:ObservableStore<RootState> = Container.get(ObservableStore as any) as any


//region DEBUG Components/Vars
//const AllDevTools = (DEBUG) ? require('components/debug/DevTools.tsx') : {}
//const DevTools = AllDevTools.DevTools || <div></div>
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




const mapStateToProps = createStructuredSelector({
	hasAvailableRepos: (state) => availableRepoCountSelector(state) > 0,
	stateType: (state)=> (state.get(AppKey) as AppState).stateType,
	dialogOpen: (state) => (state.get(UIKey) as UIState).dialogs.valueSeq().includes(true)

},createDeepEqualSelector)



/**
 * Root App Component
 */
@connect(mapStateToProps)
@Themed
@HotKeyContext()
@PureRender
class App extends React.Component<IAppProps,any> {


	appActions = Container.get(AppActionFactory)
	repoActions = Container.get(RepoActionFactory)
	issueActions = Container.get(IssueActionFactory) as IssueActionFactory
	uiActions = Container.get(UIActionFactory) as UIActionFactory
	pageBodyHolder


	onFocus = () => {
		log.info('Focused')
	}

	onBlur = () => {
		log.info('Blur')
	}

	/**
	 * Map hot keys for the root
	 *
	 * @type {{}}
	 */
	keyHandlers = {
		[KeyMaps.CommonKeys.New]: () => {
			log.info('New issue keys pressed - making dialog visible')
			this.issueActions.newIssue()
		},

		[KeyMaps.CommonKeys.MoveUp]: () => log.info('key up'),
		[KeyMaps.CommonKeys.MoveDown]:() => log.info('key down'),

		[KeyMaps.CommonKeys.Edit]: () => {
			log.info('Edit issue keys pressed - making dialog visible')
			this.issueActions.editIssue()
		},
		[KeyMaps.CommonKeys.Escape]: () => {
			log.info('Escaping and moving focus')
			ReactDOM.findDOMNode<HTMLDivElement>(this.pageBodyHolder).focus()
		},
		[KeyMaps.CommonKeys.View1]: () => {
			log.info('Escaping and moving focus')
			Container.get(UIActionFactory).focusIssuesPanel()
		},
		[KeyMaps.CommonKeys.View2]: () => {
			log.info('Escaping and moving focus')
			Container.get(UIActionFactory).focusIssueDetailPanel()
		},
		[KeyMaps.CommonKeys.Find]: () => {
			log.info('Escaping and moving focus')
			$('#header').find('input').focus()
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
					<HotKeys keyMap={KeyMaps.App}
					         handlers={this.keyHandlers}
					         onFocus={this.onFocus}
					         onBlur={this.onBlur}
					         id="appRoot"
					>
						<IssueEditDialog />
						<RepoAddDialog />

						{/* Global flex box */}
						<div className={rootClasses}
						     style={makeStyle(styles.content,theme.app)}>

							<Header visibility={headerVisibility}/>

							<div ref={(c) => this.pageBodyHolder = c}
							         style={makeStyle(FlexScale,FlexColumn)}>

								<div style={contentStyles}>
									<page.component />
								</div>

								{/*<DevTools/>*/}
								{/*<DevTools ref={(c) => devToolsRef = c}/>*/}
								<ToastMessages/>
							</div>

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
			Container.get(UIActionFactory).focusAppRoot()
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






