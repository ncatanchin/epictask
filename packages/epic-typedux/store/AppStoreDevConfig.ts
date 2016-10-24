

const log = getLogger(__filename)

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
 */
function makeRemoteMiddleware(name:string = null) {
	if (DEBUG) {
		const
			remoteDevTools = require('remote-redux-devtools')
		
		return remoteDevTools({
			name: 'EpicTask - ' + (name || (Env.isRenderer ? 'RENDERER' : 'MAIN')),
			realtime: true,
			hostname: 'localhost', port: 8787
		})
	}
	return NullMiddleware
}

let DevTools = null, DevToolsMiddleware = null

export function getDevTools() {
	return DevTools
}

export function loadDevTools() {
	if (DevToolsMiddleware)
		return DevToolsMiddleware
	
	// DevTools = require('ui/components/debug/DevTools.tsx').DevTools
	// DevToolsMiddleware = DevTools.instrument()
	
	
	return DevToolsMiddleware
}


export function makeReactotronEnhancer(enhancers) {
	if (DEBUG) {
		try {
			const
				Reactotron = require('reactotron-react-js').default
			
			let
				createReactotronEnhancer = require('reactotron-redux')
			
			createReactotronEnhancer = createReactotronEnhancer.default || createReactotronEnhancer
			
			enhancers.push(createReactotronEnhancer(Reactotron))
		} catch (err) {
			log.error(`Failed to add reactotron`, err)
		}
	}
}

/**
 * Add dev middleware to enhancers list
 *
 * @param enhancers
 */
export default function addDevMiddleware(enhancers) {
	if (typeof window !== 'undefined' && window.devToolsExtension) {
		//makeReactotronEnhancer(enhancers)
		
		enhancers.push(window.devToolsExtension())
	} else if (DEBUG) {
		//enhancers.push(makeRemoteMiddleware())
	}
	
}

/**
 * Declare dev tools extensions
 */
declare global{
	interface Window {
		devToolsExtension:any
	}
}
