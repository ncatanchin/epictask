
//import * as PureRenderMixin from 'react-addons-pure-render-mixin'
import shallowCompare = require('react-addons-shallow-compare')
/**
 * Pure render mixin as a decorator
 *
 * @param Component
 * @returns {any}
 * @constructor
 */
export function PureRender(Component) {
	//Object.assign(Component.prototype,PureRenderMixin)

	const {shouldComponentUpdateFn} = Component.prototype
	Component.prototype.shouldComponentUpdate = function(nextProps, nextState) {
		const diff = shallowCompare(this,nextProps, nextState)

		let compDiff = false
		if (!diff && shouldComponentUpdateFn) {
			compDiff = shouldComponentUpdateFn.call(this,nextProps,nextState)
		}

		return compDiff || diff

	}
	return Component
}