/**
 * Content root for epicly
 */


// Imports
import * as React from 'react'
import { Provider } from 'react-redux'
const {Flexbox,FlexItem} = require('flexbox-react')

// Get the pieces
import {MuiThemeProvider} from "material-ui/styles"
import {RootContainerComponent,HeaderComponent} from './'
import {getStore} from '../store/AppStore'
import {getPage} from './pages/index'
import {AppActionFactory} from '../actions/AppActionFactory'
import {AppState,TAppState} from '../actions/AppState'


// Build the container
const log = getLogger(__filename)
require('../../assets/fonts/fonts.global.css')
log.info('BootStrapping')

const store = getStore()
const appActions = new AppActionFactory()

// DEBUG then load DevTools
const DevTools = (DEBUG) ? require('./debug/DevTools.tsx') : <div></div>

interface AppProps {

}

/**
 * Root App Component
 */
@CSSModules(require('./AppRoot.css'))
class App extends React.Component<AppProps,TAppState> {

	static getInitialState() {
		return appActions.state
	}

	static childContextTypes = {
		muiTheme: React.PropTypes.object.isRequired
	}

	private observer

	constructor(props = {}) {
		super(props)
	}

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
				{/* Global flex box */}
				<div className="fill-height fill-width">
					<MuiThemeProvider muiTheme={getTheme()}>
						<Flexbox flexDirection="column" minHeight="100vh" minWidth="100vw">
							<FlexItem flex="0 0 auto" >
								<HeaderComponent/>
							</FlexItem>

							<RootContainerComponent>
								<page.component />
							</RootContainerComponent>

						</Flexbox>
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



