
import { getValue, isFunction } from "typeguard"
import { shallowEquals } from "epic-global/ObjectUtil"
const
	log = getLogger(__filename)

export function focusElementById(id:string,timeout = 50) {
	if (ProcessConfig.isType(ProcessType.UI))
		setTimeout(() => $(`#${id}`).focus(),timeout)
}


export function isReactComponent(c:any):c is React.Component<any,any> {
	return c && (
			c instanceof React.Component ||
			(c.prototype && c.prototype.isPrototypeOf(React.Component))
		)
}

/**
 * Unwrapped references
 *
 * @param component
 * @returns {any}
 */
export function unwrapRef<T>(component:T):T {
	
	while(component && (component as any).getWrappedInstance) {
		component = (component as any).getWrappedInstance()
	}
	
	return component as any
}

/**
 * Create a promised component
 *
 * @param loader
 * @returns {()=>Promise<TComponent>}
 */
export function makePromisedComponent(loader:TComponentLoader): TPromisedComponentLoader {
	return function() {
		const
			resolver = Promise.defer()
		
		loader(resolver)
		
		return resolver.promise as Promise<TComponentAny>
	}
}


export function isActiveComponent(comp) {
	return getValue(() => ReactDOM.findDOMNode(comp).contains(document.activeElement),false)
}


export function benchmarkLoadTime(to:string) {
	/**
	 * Tron logging window load time
	 */
	const
		startLoadTime:number = (window as any).startLoadTime,
		loadDuration = Date.now() - startLoadTime
	
	log.tron(`${to} took ${loadDuration / 1000}s`)
}


export type TPropsFn = (props) => any
export type TWatchedPropTest = string|string[]|TPropsFn

/**
 * Test current prop value
 *
 * @param value
 * @param props
 * @param propWatch
 * @returns {boolean}
 */
function testPropWatch(value,props,propWatch) {
	const
		newValue = isFunction(propWatch) ? propWatch(props) : _.get(props,propWatch)
	
	return newValue === value
}


export interface IPropMapper {
	remap:Function
}

export interface IMapPropsOpts<P> {
	watchedProps?:Array<TWatchedPropTest>
	onMount?:(mapper:IPropMapper,props:P,data:any) => any
	onUnmount?:(mapper:IPropMapper,props:P,data:any) => any
}
export function MappedProps(
	propsFn:TPropsFn,opts:IMapPropsOpts<any> = {} as any) {
	
	const
		{watchedProps,onMount,onUnmount} = opts
	
	return (Component):any => {
		return class MapPropsOnChange extends React.Component<any,any> {
			
			constructor(props,context) {
				super(props,context)
				
				this.state = {
					mappedProps: {},
					data: {}
				}
			}
			
			/**
			 * Map the props
			 *
			 * @param props
			 */
			private mapProps = (props = this.props) => {
				const
					{values,lastProps} = this.state
				
				if (props === lastProps)
					return
				
				if (values && watchedProps.length && watchedProps.length === values.length) {
					const
						newValues = watchedProps.map(propWatch =>
							isFunction(propWatch) ? propWatch(props) : _.get(props,propWatch)
						)
					
					if (values.every((value,index) => value === newValues[index])) {
						log.debug('No change in props')
						return
					}
				}
				
				this.setState({
					lastProps: props,
					mappedProps: propsFn(props)
				})
			}
			
			
			shouldComponentUpdate(nextProps,nextState) {
				return !shallowEquals(this.state.mappedProps,nextState.mappedProps)
			}
			
			remap() {
				this.setState({
					values: null
				},() => this.mapProps())
			}
			
			/**
			 * On mount check props
			 */
			componentWillMount = () => {
				if (onMount) {
					const
						data = Object.assign({},this.state.data)
					
					onMount(this,this.props,data)
					this.setState({
						data
					}, () => this.mapProps())
				} else {
					this.mapProps()
				}
			}
			
			componentWillUnmount() {
				if (onUnmount) {
					const
						data = Object.assign({},this.state.data)
					
					onUnmount(this,this.props,data)
					this.setState({
						data
					})
				}
			}
			
			/**
			 * On update check props
			 */
			componentWillReceive = this.mapProps
			
			/**
			 *
			 */
			render() {
				const
					{mappedProps} = this.state
				
				return <Component {...this.props} {...mappedProps} />
			}
		} as any
	}
}