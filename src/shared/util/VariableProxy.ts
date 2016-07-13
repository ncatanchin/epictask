
import {getLogger} from 'typelogger'
const log = getLogger(__filename)

//const hasRealProxy = ((typeof global !== 'undefined' && global.Proxy) || (typeof window !== 'undefined' && window.Proxy))

/**
 * A reloadable proxy between a target object
 * and the end consumer.
 *
 * Implemented specifically for hot loading
 */
export class VariableProxy<T> {
	target:any;
	proxy:T = {} as T

	constructor(target:T,private ignoredProps = []) {
		this.changeTarget(target);
	}

	private addProxies(o) {
		if (!o) return

		let keys = Object.getOwnPropertyNames(o);
		log.info("Creating proxy for",keys)

		keys.forEach((prop) => {
			if (!/(constructor|prototype|__proto__)/.test(prop) &&
				!this.proxy[prop] &&
				this.ignoredProps.indexOf(prop) < 0) {
				if (_.isFunction(this.target[prop])) {
					this.proxy[prop] = (...args) => {
						return this.target[prop].apply(this.target,args);
					};
				} else {
					Object.defineProperty(this.proxy, prop, {
						get: () => {
							return this.target[prop]
						},
						set: (newVal) => {
							return this.target[prop] = newVal
						}
					})
				}


			}
		});
	}
	changeTarget(target) {
		this.target = target

		// Update the proxy to ensure all methods are available

		// this.addProxies(_.get(this,'target'))
		let proto = _.get(this,'target.constructor.prototype')
		while (proto) {
			this.addProxies(proto)
			proto = _.get(proto,'__proto__')
		}

		// this.addProxies(_.get(this,'target.__proto__'))


	}
}



