import 'shared/CommonEntry'
import './AppGlobals'

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

const log = getLogger(__filename)

// Build the container
log.info('BootStrapping')

const store = getStore()

// Sync the history
//const appHistory = useRouterHistory(createHashHistory)({queryKey:false})
//const history = hashHistory
const history = syncHistoryWithStore(hashHistory, store.getReduxStore(),{
	selectLocationState: (state) => {
		const routingState = state.get('routing')
		const routingStateJs = (routingState) ? routingState.toJS() : null
		//log.info('Location state', state,JSON.stringify(routingStateJs,null,4))
		return routingStateJs
	}
})

const DevTools = (DEBUG) ? require('./debug/DevTools') : <div/>

/**
 * Root App Component
 */
class App extends React.Component<any,any> {

	static childContextTypes = {
		muiTheme: React.PropTypes.object.isRequired
	}

	getChildContext() {
		return {muiTheme: getTheme()};
	}

	/**
	 * Render the app container
	 */
	render() {
		return (
			<Provider store={store.getReduxStore()}>
				<div className="fill-height fill-width">

					<MuiThemeProvider muiTheme={getTheme()}>
						<div className="fill-height fill-width">
							<HeaderComponent/>
							<RootContainerComponent>
								<Router history={history}>
									<Route path="/login" component={LoginPage}/>
									<Route path="/" component={AppBody} >
										<IndexRedirect to="/login"/>
										<Route path="/repos" component={ReposPage}/>
										<Route path="*" component={LoginPage}/>
									</Route>
								</Router>
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



