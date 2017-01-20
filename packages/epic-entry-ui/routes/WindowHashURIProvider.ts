import { SimpleEventEmitter } from "epic-global/SimpleEventEmitter"
import { TRouteChangeListener, IRouterLocation } from "./Router"
import { addHotDisposeHandler } from "epic-global/HotUtils"
import { isString } from "epic-global"
import { IRouteURIProvider } from "epic-entry-ui/routes"
/**
 * Created by jglanz on 10/27/16.
 */

const
	log = getLogger(__filename),
	hashListeners:WindowHashURIProvider[] = [],
	{URLSearchParams} = require('urlsearchparams')

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


/**
 * Set the window location
 *
 * @param location
 */
export function setWindowLocation(location:IRouterLocation|string) {
	if (isString(location)) {
		location = {uri:location,params:{}}
	}
	
	let
		{uri,params} = location
	
	params = params || {} as any
	params.__cacheBuster = Math.random() * Date.now()
	
	const
		paramKeys = Object.keys(params),
		newHash = `#${uri}?${paramKeys
			.map(key => `${key}=${encodeURIComponent(params[key])}`)
			.join('&')
			}`
	
	setImmediate(() => {
		log.debug(`Setting new hash`,newHash)
		window.location.hash = newHash
	})
}
/**
 * WindowHashURIProvider
 *
 * @class WindowHashURIProvider
 * @constructor
 **/
export class WindowHashURIProvider extends SimpleEventEmitter<TRouteChangeListener> implements IRouteURIProvider {
	
	/**
	 * Current location
	 */
	private location:IRouterLocation
	
	/**
	 * Get the current location
	 *
	 * @returns {IRouterLocation}
	 */
	getLocation() {
		return this.location
	}
	
	/**
	 * Set a new location
	 *
	 * @param location
	 */
	setLocation = setWindowLocation
		
	
	/**
	 * on hash change handler
	 */
	private onHashChange = (event = null) => {
		let
			newHash = location.hash || ""
		
		if (newHash.startsWith('#'))
			newHash = newHash.substring(1)
		
		const
			parts = newHash.split("?"),
			uri = parts[0] || "",
			paramString = parts[1],
			params = {}
		
		if (paramString) {
			new URLSearchParams(paramString).list.forEach(pair => {
				if (pair && isString(pair.name))
					params[pair.name] = pair.value
			})
		}
		
		// SET THE LOCATION
		this.location = {
			uri,
			params
		}
		
		this.emit(this,uri,params)
	}
	
	constructor() {
		super()
		
		this.onHashChange()
		
		window.addEventListener("hashchange",this.onHashChange)
		
		if(module.hot)
			hashListeners.push(this)
	}
	
	/**
	 * Detach from window hash change
	 */
	detach() {
		window.removeEventListener("hashchange",this.onHashChange)
	}
	
}

if (DEBUG) {
	assignGlobal({
		setWindowLocation
	})
}

addHotDisposeHandler(module,() => hashListeners.forEach(it => it.detach()))