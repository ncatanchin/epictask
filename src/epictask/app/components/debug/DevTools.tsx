import * as React from 'react'
//import * as ReactDOM from 'react-dom'
import {createDevTools} from 'redux-devtools'

// import * as LogMonitor from 'redux-devtools-log-monitor'
const DockMonitor = require('redux-devtools-dock-monitor').default
const SliderMonitor = require('redux-slider-monitor')
const Inspector = require('redux-devtools-inspector').default
const LogMonitor = require('redux-devtools-log-monitor').default

export = createDevTools(
    <DockMonitor toggleVisibilityKey="ctrl-h"
        changePositionKey="ctrl-q"
        changeMonitorKey='ctrl-m'
        defaultPosition="bottom">

	    <Inspector theme={'tomorrow'} supportImmutable={true} isLightTheme={false}/>
        <LogMonitor theme={'tomorrow'}/>
        <SliderMonitor/>
    </DockMonitor>
)
