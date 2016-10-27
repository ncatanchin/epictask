import { SimpleEventEmitter } from "epic-global/SimpleEventEmitter"
import { TRouteChangeListener, IRouterLocation } from "./Router"
import { addHotDisposeHandler } from "epic-global/HotUtils"
import { isString } from "epic-global"
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
 * WindowHashURIProvider
 *
 * @class WindowHashURIProvider
 * @constructor
 **/
export class WindowHashURIProvider extends SimpleEventEmitter<TRouteChangeListener> {
	
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
		
		this.emit(uri,params)
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

addHotDisposeHandler(module,() => hashListeners.forEach(it => it.detach()))