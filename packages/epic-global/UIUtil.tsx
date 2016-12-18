import { getValue, isFunction } from "typeguard"

import { shallowEquals,cloneObjectShallow } from "./ObjectUtil"

const
	log = getLogger(__filename)

log.setOverrideLevel(LogLevel.DEBUG)

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


export type TPropsFn = (props,mapper?:IPropMapper) => any
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


export interface IPropMapper extends React.Component<any,any> {
	remap:Function
}

export interface IMapPropsOpts<P> {
	watchedProps?:Array<TWatchedPropTest>
	onMount?:(mapper:IPropMapper,props:P,data:any) => any
	onUnmount?:(mapper:IPropMapper,props:P,data:any) => any
	onRender?:(mapper:IPropMapper,defaultRender:() => any,props:P,data:any) => any
	
}
export function MappedProps(
	propsFn:TPropsFn,opts:IMapPropsOpts<any> = {} as any) {
	
	const
		{watchedProps,onMount,onUnmount, onRender} = opts
	
	return (Component):any => {
		return class MapPropsOnChange extends React.Component<any,any> {
			
			private mounted = false
			
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
				
				this.mounted && this.setState({
					lastProps: props,
					mappedProps: propsFn(props,this)
				})
			}
			
			
			shouldComponentUpdate(nextProps,nextState) {
				return !shallowEquals(this.props,nextProps) || !shallowEquals(this.state.mappedProps,nextState.mappedProps)
			}
			
			/**
			 * Debounced remap()
			 */
			remap = _.debounce(() => this.mounted && this.setState({
						lastProps: null,
						values: null
					},() => this.mapProps())
			,100)
			
			/**
			 * On mount check props
			 */
			componentWillMount = () => {
				this.mounted = true
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
			
			componentWillUnmount = () => {
				this.mounted = false
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
			defaultRender = () => {
				const
					{mappedProps} = this.state
				
				return <Component {...this.props} {...mappedProps} />
			}
			
			render() {
				if (onRender) {
					return onRender(
						this,
						this.defaultRender,
						cloneObjectShallow(this.props,this.state.mappedProps),
						this.state.data)
				}
				
				return this.defaultRender()
				
			}
		} as any
	}
}

/**
 * DOM Util direct from material ui
 *
 */
export const Dom = {
	
	isDescendant(parent, child) {
		let
			node = child.parentNode
		
		while (node !== null) {
			if (node === parent)
				return true
			
			node = node.parentNode
		}
		
		return false
	},
	
	offset(el) {
		const
			rect = el.getBoundingClientRect()
		
		return {
			top: rect.top + document.body.scrollTop,
			left: rect.left + document.body.scrollLeft,
		}
	}
}


export function nextFormField(srcElem,wrap = true) {
	let
		elem = srcElem
	if (!elem)
		return null
	
	if (!(elem instanceof HTMLElement)) {
		elem = ReactDOM.findDOMNode(srcElem)
	}
	
	if (!(elem instanceof HTMLElement)) {
		log.debug(`No html element found`,elem,srcElem)
		return null
	}
	
	if (!['input','select','textarea'].includes(elem.tagName.toLowerCase())) {
		log.debug(`Elem is not a field, looking for a child INPUT`,elem.tagName,elem,srcElem)
		elem = $(elem).find('input')
		
		if (!['input','select','textarea'].includes(getValue(() => elem[0].tagName.toLowerCase(),''))) {
			log.debug(`Still no input`)
			return null
		}
	}
	
	elem = $(elem)
	
	const
		elemRaw = elem[0],
		form = elem.closest('form')
	
	log.debug(`Found form`,form)
	if (!form.length) {
		return null
	}
	
	const
		fields = form.find('input,select,textarea,[tab-index]')
	
	let
		index = -1
	
	for (let i = 0; i < fields.length; i++) {
		const
			field = fields[i]
		
		if (field === elemRaw) {
			index = i
			break
		}
	}
	
	log.debug(`Found index`,index,elem,fields,form)
	if (index === -1) {
		return null
	}
	
	index += 1
	
	if (wrap && index >= fields.length)
		index = 0
	
	return fields[index]
	
	
	
	
	
}



export function focusNextFormField(elem,wrap = true) {
	const
		nextElem = nextFormField(elem,wrap)

	log.debug(`Found next element to focus`,nextElem,elem)
	if (nextElem) {
		$(nextElem).focus()
	}
}

