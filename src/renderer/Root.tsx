import {createMuiTheme} from '@material-ui/core/styles'
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider'
import * as React from "react"
import Loadable from "react-loadable"

//import {makeTransition, mergeStyles, rem, remToPx} from "renderer/styles/ThemedStyles"
import {hot} from 'react-hot-loader'
import App from "renderer/components/App"
import {darkTheme} from "renderer/styles/ThemedStyles"


// const App = Loadable({
//   loader: () => import("renderer/components/App"),
//   loading: () => <div>loading</div>
// })

/**
 * Generate the MUI palette for mapper
 */

class Root extends React.Component<{}, {}> {
	
	constructor(props, context) {
		super(props, context)
	}
	
	render() {
		// ConnectedRouter will use the store from the Provider automatically
		return <MuiThemeProvider theme={darkTheme}>
			<App/>
		</MuiThemeProvider>
		
		
	}
}


export default hot(module)(Root)
