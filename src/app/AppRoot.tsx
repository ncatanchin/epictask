
import * as React from 'react'
import * as ReactDOM from 'react-dom'

//const MuiThemeProvider = require('material-ui/styles/MuiThemeProvider').default
//const Styles = require('material-ui/styles')

import * as MUI from 'material-ui'
import * as MUIStyles from 'material-ui/styles'
import {MuiThemeProvider} from "material-ui/styles"
//import {ThemeWrapper} from 'material-ui'
import Header from './components/Header'
//import ThemeManager from 'material-ui/lib/styles/theme-manager'
//import {Styles} from "material-ui"
//import {ThemeManager} from "material-ui/lib/styles/theme-manager"
//import Styles from 'material-ui/lib/styles'


console.log('BootStrapping')

const theme = MUIStyles.getMuiTheme(MUIStyles.darkBaseTheme)

const App = () => {
	return <MuiThemeProvider muiTheme={theme}>
		<Header/>
	</MuiThemeProvider>
}

ReactDOM.render(
	<App />,
	document.getElementById('root')
)



