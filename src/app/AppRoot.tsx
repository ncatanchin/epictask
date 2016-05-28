import '../shared/CommonEntry'
import './AppGlobals'
import './AppServices'

require('../assets/fonts/fonts.global.css')

// Retrieve the getTheme method from the theme manager
import "./ThemeManager"

// Imports
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import {Router,IndexRedirect,Route,hashHistory} from 'react-router'
import {ReposPage} from './repos'
import {LoginPage} from './auth'
import {syncHistoryWithStore} from 'react-router-redux'

// Get the pieces
import {MuiThemeProvider} from "material-ui/styles"
import {RootContainerComponent,HeaderComponent,AppBody} from './components'
import {getStore} from './store/AppStore'
import {AppActionFactory} from './AppActionFactory'
import {getPage} from './Pages'
import {AppState} from './AppState'

const log = getLogger(__filename)

// Build the container
log.info('BootStrapping')

const store = getStore()


const appActions = new AppActionFactory()

// Sync the history
//const appHistory = useRouterHistory(createHashHistory)({queryKey:false})
//const history = hashHistory
// const history = syncHistoryWithStore(hashHistory, store.getReduxStore(),{
// 	selectLocationState: (state) => {
// 		const routingState = state.get('routing')
// 		const routingStateJs = (routingState) ? routingState.toJS() : null
// 		//log.info('Location state', state,JSON.stringify(routingStateJs,null,4))
// 		return routingStateJs
// 	}
// })

// DEBUG then load DevTools
const DevTools = (DEBUG) ? require('./debug/DevTools.tsx') : <div></div>

/**
 * Root App Component
 */
class App extends React.Component<any,typeof AppState> {

	static getInitialState() {
		return appActions.state
	}

	static childContextTypes = {
		muiTheme: React.PropTypes.object.isRequired
	}

	private observer

	getChildContext() {
		return {muiTheme: getTheme()};
	}


	componentWillMount():void {
		this.observer = store.observe(appActions.leaf(),() => this.setState(appActions.state))
	}

	componentWillUnmount():void {
		if (this.observer) {
			this.observer()
			this.observer = null
		}
	}

	/**
	 * Render the app container
	 */
	render() {
		const page = {component:getPage()}

		return (
			<Provider store={store.getReduxStore()}>
				<div className="fill-height fill-width">

					<MuiThemeProvider muiTheme={getTheme()}>
						<div className="fill-height fill-width">
							<HeaderComponent/>
							<RootContainerComponent>
								<page.component>

								</page.component>
							</RootContainerComponent>
						</div>
					</MuiThemeProvider>
					<DevTools/>
				</div>
			</Provider>

		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('root')
)



