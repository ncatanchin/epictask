

//
// /**
//  * SImply appends function to existing or creates a new one
//  *
//  * The provided function will have the initial context `this`
//  *
//  * @param proto
//  * @param fnName
//  * @param fn
//  */
// function extendOrAddPrototypeFunction(proto:any,fnName:string,fn:Function) {
// 	const origFn = proto[fnName]
// 	proto[fnName] = function(...args) {
//
// 		if (origFn) origFn.apply(this,args)
//
// 		const wrappedFn =
// 	}
//
// 	return proto
// }
/**
 * Add context for Hotkeys
 *
 * @constructor
 * @param hotKeyMap
 */
export function HotKeyContext(hotKeyMap = {}) {

	/**
	 * @param Component - the component to wrap
	 */
	return (Component) => {

		const getChildContextFn = Component.prototype.getChildContext

		const getChildContext = function () {
			const result = (getChildContextFn) ? getChildContextFn.call(this) : null

			//noinspection JSPotentiallyInvalidUsageOfThis
			return assign(result || {}, {
				hotKeyMap: this.__hotKeyMap__
			})
		}

		// Original mount fn
		const componentWillMountFn = Component.prototype.componentWillMount
		//Object.defineProperty(Component,'prototype',{writable:true})
		assign(Component, {
			contextTypes: assign(Component.contextTypes || {}, {
				hotKeyMap: React.PropTypes.object
			}),
			childContextTypes: assign(Component.childContextTypes || {}, {
				hotKeyMap: React.PropTypes.object
			})
		})
		assign(Component.prototype,{
			getChildContext,
			componentWillMount() {
				this.updateMap()
				if (componentWillMountFn)
					componentWillMountFn.call(this)
			},

			updateMap() {
				const newMap = this.buildMap();

				if (!_.isEqual(newMap, this.__hotKeyMap__)) {
					this.__hotKeyMap__ = newMap;
					return true;
				}

				return false;
			},

			buildMap() {
				const parentMap = this.context.hotKeyMap || {};
				const thisMap = this.props.keyMap || {};

				return assign({}, parentMap, hotKeyMap, thisMap);
			},

			getMap() {
				return this.__hotKeyMap__;
			}
		})

	

	}
}


export default HotKeyContext