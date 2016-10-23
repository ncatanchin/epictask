//require('source-map-support').install()
import 'reflect-metadata'
ProcessConfig.setType(ProcessType.Storybook)

import 'shared/NamespaceConfig'
import 'shared/LogConfig'


//import 'shared/RendererLogging'
import 'shared/PromiseConfig'
import "shared/Globals"
import "ui/UIGlobals"

// Load Styles
import 'shared/themes/styles'

// Now the theme manager
import "shared/themes/ThemeManager"

import {Provider} from 'react-redux'
import {MuiThemeProvider} from "material-ui/styles"
import {loadAndInitStorybookStore,getReduxStore} from 'shared/store/AppStore'


// Setup the store for storybook
const store = loadAndInitStorybookStore()

// Expose get state to window
const win = (window as any)
win.top.getState = win.getState = () => getReduxStore().getState()


// Load Global styles
require('styles/MainEntry.global.scss')
require('assets/fonts/fonts.global.scss')
require('styles/split-pane.global.scss')

const { addDecorator } = require('@kadira/storybook')


export const getDecorator = getStory => <MuiThemeProvider muiTheme={getTheme()}>
	<Provider store={getReduxStore()}>
		<div style={Object.assign({},getTheme().app,{height: '100vh'},FillWidth)}>{getStory()}</div>
	</Provider>
</MuiThemeProvider>
