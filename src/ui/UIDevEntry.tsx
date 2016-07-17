// Imports
import * as React from 'react'
import * as ReactDOM from 'react-dom'

// Load logger
const log = require('typelogger').create(__filename)

// Config
require('shared/LogConfig')
require('./../shared/RendererLogging')
require('./UIGlobals')

// Import Store & Dev Tools getter
import {initStore,getDevTools,getReduxStore} from 'shared/store'
initStore(true)

const DevTools = getDevTools() || <div/>
const rootElement = window.document.getElementById('root')

ReactDOM.render(
	<DevTools store={getReduxStore()}/>,
	rootElement,
	() => {
		log.info('DevTools Rendered')
	}
)

