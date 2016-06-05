/**
 * Content root for epicly
 */


// Imports
import * as React from 'react'
import {Provider, connect} from 'react-redux'
const {HotKeys} = require('react-hotkeys')
import {makeStyle,rem,FlexRowCenter,FlexColumn,FlexColumnCenter,FlexScale,Fill,makeTransition} from 'app/themes'

// Get the pieces
import {MuiThemeProvider} from "material-ui/styles"
import {HeaderComponent} from 'components'
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

const styles = require('./AppRoot.scss')



/**
 * Root App Component
 */
@connect(mapStateToProps)
@CSSModules(styles)
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
		const page = {component: getPage(this.props.stateType)}
		const {theme} = this.props
		const contentStyles = {
			backgroundColor: theme.palette.canvasColor,
			flex: '1 1 0',
			display: 'flex',
			flexDirection: 'column'
		}

		const {availableRepos} = this.props
		const expanded = !availableRepos || availableRepos.length === 0

		const bodyCollapsed = (!expanded) ? '' : ' ' + styles.collapsed

		return (
			<MuiThemeProvider muiTheme={this.props.theme}>
				<Provider store={store.getReduxStore()}>
					<HotKeys keyMap={KeyMaps.App} handlers={this.keyHandlers}>
						{/* Global flex box */}
						<div className="fill-height fill-width" styleName="app">
							<HeaderComponent expanded={expanded} className={styles.header}/>
							<HotKeys ref={(c) => this.pageBodyHolder = c} style={makeStyle(FlexScale,FlexColumn)}>
								<div style={contentStyles} className={styles.content + bodyCollapsed}>
									<page.component />
								</div>
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

//if (appActions.state.theme)
render()

// Observe theme changes
// let observer = store.observe([appActions.leaf(),'theme'],() => {
// 	log.info('Theme change received')
// 	render()
// })

if (module.hot) {
	module.hot.accept()
	module.hot.dispose(() => {
		// if (observer) {
		// 	observer()
		// 	observer = null
		// }
	})
}






