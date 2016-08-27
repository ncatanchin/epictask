

/**
 * Null middleware that can be used
 * wherever a passthru is required
 *
 * @param f
 * @constructor
 */
const NullMiddleware = f => f



/**
 * Make remote middleware
 *
 * @returns {Array<Middleware>}
 */
function makeRemoteMiddleware(name:string = null) {
	const remoteDevTools = require('remote-redux-devtools')
	return remoteDevTools({
		name: 'EpicTask - ' + (name || ((Env.isRenderer) ? 'RENDERER' : 'MAIN')),
		realtime: true,
		hostname: 'localhost', port: 8787
	})
}

let DevTools = null, DevToolsMiddleware = null

export function getDevTools() {
	return DevTools
}

export function loadDevTools() {
	if (DevToolsMiddleware)
		return DevToolsMiddleware
	
	DevTools = require('ui/components/debug/DevTools.tsx').DevTools
	DevToolsMiddleware = DevTools.instrument()
	
	return DevToolsMiddleware
}


function makeReactotronEnhancer() {
	const Reactotron = require('reactotron-react-js').default
	
	const createReactotronEnhancer = require('reactotron-redux')
	//createReactotronEnhancer = createReactotronEnhancer.default || createReactotronEnhancer
	//import createReactotronEnhancer from 'reactotron-redux'
	
	return createReactotronEnhancer(Reactotron)
}

export default function (enhancers) {
	if (typeof window !== 'undefined') {
		enhancers.push(makeReactotronEnhancer())
		
		if (window.devToolsExtension)
			enhancers.push(window.devToolsExtension())
	} else {
		enhancers.push(makeRemoteMiddleware())
	}
	
}