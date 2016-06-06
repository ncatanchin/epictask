/**
 * Content root for epicly
 */

// Imports
import * as React from 'react'
import {Provider, connect} from 'react-redux'
const {HotKeys} = require('react-hotkeys')
import {makeStyle,rem,FlexRowCenter,FlexColumn,FlexColumnCenter,FlexScale,Fill,makeTransition} from 'app/styles'

// Get the pieces
import {MuiThemeProvider} from "material-ui/styles"
import {Header,HeaderVisibility} from 'components'
import {getStore} from 'app/store/AppStore'
import {getPage} from 'components/pages'
import {AppActionFactory} from 'app/actions'
import {AppState, TAppState} from 'app/actions'
import {AppStateType,AvailableRepo} from 'shared'
import {AppKey, RepoKey} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'


const log = getLogger(__filename)

// Build the container
require('assets/fonts/fonts.global.scss')
require('styles/split-pane.global.scss')

const store = getStore()
const appActions = new AppActionFactory()

// DEBUG then load DevTools
const DevTools = (DEBUG) ? require('components/debug/DevTools.tsx') : <div></div>

interface AppProps {
	store:any
	theme:any
	stateType:AppStateType,
	availableRepos?:AvailableRepo[]
}

// Styles
const styles = {
	app: makeStyle(FlexColumn,FlexScale,{
		overflow: 'hidden'
	}),

	header: makeStyle(makeTransition(), FlexRowCenter, {

	}),

	content: makeStyle(makeTransition(), FlexColumn,{
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1
	}),

	collapsed: makeStyle({flexGrow: 0})
}



// Redux state -> props
function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const repoState = state.get(RepoKey)
	return {
		theme: getTheme(),//appState.theme,
		stateType: appState.stateType,
		availableRepos: repoState.availableRepos
	}
}

//const styles = require('./AppRoot.scss')



/**
 * Root App Component
 */
@connect(mapStateToProps)
class App extends React.Component<AppProps,TAppState> {

	pageBodyHolder

	constructor(props, context) {
		super(props, context)
	}



	keyHandlers = {
		[KeyMaps.CommonKeys.Escape]: () => {
			log.info('Escaping and moving focus')
			ReactDOM.findDOMNode<HTMLDivElement>(this.pageBodyHolder).focus()
		}
	}

	/**
	 * Render the app container
	 */
	render() {
		const {availableRepos,stateType,theme} = this.props
		const
			page = {component: getPage(stateType)},
			expanded = stateType > AppStateType.AuthLogin && (!availableRepos || availableRepos.length === 0),
			contentStyles = makeStyle(styles.content, {
				backgroundColor: theme.palette.canvasColor,
				display: 'flex',
				flexDirection: 'column'
			},expanded && styles.collapsed),
			headerVisibility = (stateType < AppStateType.Home) ? HeaderVisibility.Hidden :
				(expanded) ? HeaderVisibility.Expanded :
					HeaderVisibility.Normal

		return (
			<MuiThemeProvider muiTheme={this.props.theme}>
				<Provider store={store.getReduxStore()}>
					<HotKeys keyMap={KeyMaps.App} handlers={this.keyHandlers}>
						{/* Global flex box */}
						<div className="fill-height fill-width" style={styles.content}>
							<Header visibility={headerVisibility}/>
							<HotKeys ref={(c) => this.pageBodyHolder = c}
							         style={makeStyle(FlexScale,FlexColumn)}>

								<div style={contentStyles}>
									<page.component />
								</div>

								{/* DevTools */}
								<DevTools/>

							</HotKeys>
						</div>
					</HotKeys>
				</Provider>
			</MuiThemeProvider>

		)
	}
}


function render() {
	const appState = appActions.state
	ReactDOM.render(
		<App
			store={store.getReduxStore()}
			theme={appState.theme}
			stateType={appState.stateType}
		/>,
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






