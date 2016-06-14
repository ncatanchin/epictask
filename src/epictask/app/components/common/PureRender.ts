
import * as PureRenderMixin from 'react-addons-pure-render-mixin'

/**
 * Pure render mixin as a decorator
 *
 * @param Component
 * @returns {any}
 * @constructor
 */
export function PureRender(Component) {
	Object.assign(Component.prototype,PureRenderMixin)
	return Component
}