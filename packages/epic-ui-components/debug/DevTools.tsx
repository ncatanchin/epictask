// import {createDevTools} from 'redux-devtools'
//
// // import * as LogMonitor from 'redux-devtools-log-monitor'
// const DockMonitor = require('redux-devtools-dock-monitor').default
// const SliderMonitor = require('redux-slider-monitor')
// const Inspector = require('redux-devtools-inspector').default
// const LogMonitor = require('redux-devtools-log-monitor').default
//
//
// function attachInspector(component) {
// 	if (component)
// 		component.handleSelectTab('State')
// }
//
// /**
//  * Create DevTools
//  *
//  * @type {"redux-devtools".IDevTools}
//  */
// export const DevTools = (!Env.isDev) ? null : createDevTools(
// 	<DockMonitor toggleVisibilityKey="ctrl-h"
// 	             changePositionKey="ctrl-q"
// 	             changeMonitorKey='ctrl-m'
// 	             defaultPosition="bottom"
// 	             defaultSize={0.3}
// 	             defaultIsVisible={false}
// 				 >
//
// 		<Inspector
// 			ref={(c) => attachInspector(c)}
// 			theme={'tomorrow'}
// 			monitorState={{tab:'state'}}
// 			supportImmutable={true}
// 			isLightTheme={false}/>
// 		<LogMonitor theme={'tomorrow'}/>
// 		<SliderMonitor/>
// 	</DockMonitor>
// )
//
//
//
// export function showDevTools(store) {
// 	const popup = window.open(null, 'Redux DevTools', 'menubar=no,location=no,resizable=yes,scrollbars=no,status=no') as any
//
//
// 	// Reload in case it already exists
// 	popup.location.reload();
//
// 	setTimeout(() => {
// 		popup.document.write('<div id="react-devtools-root"></div>');
// 		ReactDOM.render(
// 			<DevTools store={store} />,
// 			popup.document.getElementById('react-devtools-root')
// 		);
// 	}, 10);
// }