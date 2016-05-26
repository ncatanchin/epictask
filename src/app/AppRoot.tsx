import 'shared/CommonEntry'

const log = getLogger(__filename)

// Imports
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import {Router,IndexRoute,Route,hashHistory} from 'react-router'
import {syncHistoryWithStore} from 'react-router-redux'

// Retrieve the getTheme method from the theme manager
import "./ThemeManager"

// Get the pieces
import {MuiThemeProvider} from "material-ui/styles"
import {Container,Header,Repos,Login,AppBody} from './components'
import {getStore} from './store'

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
				<MuiThemeProvider muiTheme={getTheme()}>
					<Container>
						<Header/>
						<Router history={history}>
							<Route path="/" component={AppBody} >
								<IndexRoute component={Login}/>
								<Route path="/repos" component={Repos}/>
								<Route path="*" component={Login}/>
							</Route>
						</Router>
					</Container>
				</MuiThemeProvider>
			</Provider>
		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('root')
)



