/**
 * Add context for Hotkeys
 *
 * @param Component
 * @constructor
 */
export function HotKeyContext(Component) {

	const getChildContextFn = Component.prototype.getChildContext

	const getChildContext = function() {
		const result = (getChildContextFn) ? getChildContextFn.call(this) : null

		return assign(result || {},{
			hotKeyMap: this.__hotKeyMap__
		})
	}

	assign(Component,{
		contextTypes: assign(Component.contextTypes || {},{
			hotKeyMap: React.PropTypes.object
		}),
		childContextTypes: assign(Component.childContextTypes || {},{
			hotKeyMap: React.PropTypes.object
		}),
		prototype: assign(Component.prototype,{getChildContext})

	})

}

export default HotKeyContext