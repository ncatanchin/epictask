
const _ = require('lodash')

declare global {
	interface Array<T> {
		uniq():Array<T>
		uniqBy(prop:string|Function):Array<T>
	}
}

Array.prototype.uniq = function() {
	return _.uniq(this)
}

Array.prototype.uniqBy = function(prop:string|Function) {
	return _.uniqBy(this,prop)
}

export {
	
}