import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {createDevTools} from 'redux-devtools'

// import * as LogMonitor from 'redux-devtools-log-monitor'
const DockMonitor = require('redux-devtools-dock-monitor').default
const SliderMonitor = require('redux-slider-monitor')
const Inspector = require('redux-devtools-inspector').default
const LogMonitor = require('redux-devtools-log-monitor').default


export const DevTools = createDevTools(
	<DockMonitor toggleVisibilityKey="ctrl-h"
	             changePositionKey="ctrl-q"
	             changeMonitorKey='ctrl-m'
	             defaultPosition="right"
	             defaultSize={0.2}
				 >

		{/*<Inspector theme={'tomorrow'} supportImmutable={true} isLightTheme={false}/>*/}
		<LogMonitor theme={'tomorrow'}/>
		{/*<SliderMonitor/>*/}
	</DockMonitor>
)



export function showDevTools(store) {
	const popup = window.open(null, 'Redux DevTools', 'menubar=no,location=no,resizable=yes,scrollbars=no,status=no') as any


	// Reload in case it already exists
	popup.location.reload();

	setTimeout(() => {
		popup.document.write('<div id="react-devtools-root"></div>');
		ReactDOM.render(
			<DevTools store={store} />,
			popup.document.getElementById('react-devtools-root')
		);
	}, 10);
}