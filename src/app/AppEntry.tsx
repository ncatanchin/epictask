///<reference path="../../typings/browser.d.ts"/>

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as MUI from 'material-ui'
import {Button1} from './components/Button1'
//import ThemeManager from 'material-ui/lib/styles/theme-manager'
//import {Styles} from "material-ui"
//import {ThemeManager} from "material-ui/lib/styles/theme-manager"
//import Styles from 'material-ui/lib/styles'

console.log('hello from app')


const {ThemeManager} = MUI.Styles
// const theme = ThemeManager.getMuiTheme(Styles.darkBaseTheme)
const theme = ThemeManager.getMuiTheme(MUI.Styles.darkBaseTheme)

const App = () => (
	<MUI.ThemeWrapper theme={theme} >
		<Button1 href="http://google.com" target="_blank"  />
	</MUI.ThemeWrapper>
)

ReactDOM.render(
	<App />,
	document.getElementById('app')
)


