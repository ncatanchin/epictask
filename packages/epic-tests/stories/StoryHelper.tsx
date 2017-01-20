import 'epic-entry-shared/AppEntry'
import "epic-ui-components/UIGlobals"
//require('source-map-support').install()
import 'reflect-metadata'
ProcessConfig.setType(ProcessType.Storybook)


//import 'shared/RendererLogging'

import * as React from 'react'

// Now the theme manager
import "epic-styles"

import {Provider} from 'react-redux'

import {loadAndInitStorybookStore,getReduxStore} from "epic-typedux"


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


export const getDecorator = getStory =>
	<Provider store={getReduxStore()}>
		<div style={Object.assign({},getTheme().app,{height: '100vh'},FillWidth)}>{getStory()}</div>
	</Provider>

