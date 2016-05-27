import * as React from 'react'
//import * as ReactDOM from 'react-dom'
import {createDevTools} from 'redux-devtools'

// import * as LogMonitor from 'redux-devtools-log-monitor'
import DockMonitor from 'redux-devtools-dock-monitor'

const Inspector = require('redux-devtools-inspector').default
const LogMonitor = require('redux-devtools-log-monitor').default


export = createDevTools(
	<DockMonitor toggleVisibilityKey="ctrl-h"
	             changePositionKey="ctrl-q">
		<Inspector/>
		{/*<LogMonitor theme='tomorrow'/>*/}
	</DockMonitor>
)



