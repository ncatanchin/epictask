import shallowCompare = require('react-addons-shallow-compare')
import {interceptFn} from "shared/util"

const
	log = getLogger(__filename)


/**
 * Pure render mixin as a decorator
 *
 * @param Component
 * @returns {any}
 * @constructor
 */
export function PureRender(Component) {
	interceptFn(Component.prototype,'shouldComponentUpdate',function(origFn,nextProps,nextState) {
		const
			diff = shallowCompare(this,nextProps, nextState)
		
		let compDiff = false
		if (!diff && origFn) {
			compDiff = origFn.call(this,nextProps,nextState)
		}
		
		return compDiff || diff
	})
	
}

export default PureRender