/**
 * Content root for epicly
 */


// Imports
import * as React from 'react'
import {Provider, connect} from 'react-redux'
const {Flexbox, FlexItem} = require('flexbox-react')

// Get the pieces
import {MuiThemeProvider} from "material-ui/styles"
import {RootContainerComponent, HeaderComponent} from './'
import {getStore} from '../store/AppStore'
import {getPage} from './pages/index'
import {AppActionFactory} from '../actions/AppActionFactory'
import {AppState, TAppState} from '../actions/AppState'
import {AppStateType,Repo} from 'epictask/shared'
import {AppKey, RepoKey} from '../../shared/Constants'
const log = getLogger(__filename)

// Build the container
require('assets/fonts/fonts.global.scss')
require('styles/split-pane.global.scss')

const store = getStore()
const appActions = new AppActionFactory()

// DEBUG then load DevTools
const DevTools = (DEBUG) ? require('./debug/DevTools.tsx') : <div></div>

interface AppProps {
	store:any
	theme:any
	stateType:AppStateType,
	repo?:Repo
}

// Redux state -> props
function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const repoState = state.get(RepoKey)
	return {
		theme: getTheme(),//appState.theme,
		stateType: appState.stateType,
		repo: repoState.repo
	}
}

const styles = require('./AppRoot.scss')

/**
 * Root App Component
 */
@connect(mapStateToProps)
@CSSModules(styles)
class App extends React.Component<AppProps,TAppState> {


	constructor(props, context) {
		super(props, context)
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

		
		const bodyCollapsed = (this.props.repo) ? '' : ' ' + styles.collapsed

		return (
			<MuiThemeProvider muiTheme={this.props.theme}>
				<Provider store={store.getReduxStore()}>
					{/* Global flex box */}
					<div className="fill-height fill-width" styleName="app">
						<HeaderComponent expanded={!this.props.repo} className={styles.header}/>
						<div style={contentStyles} className={styles.content + bodyCollapsed}>
							<page.component />
						</div>
						<DevTools/>
					</div>
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






