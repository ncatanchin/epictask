
import { mergeStyles } from "./styles/CommonRules"
import { getValue, shallowEquals } from  "epic-global"
import { IPalette } from "./material"
import { addHotDisposeHandler } from "epic-global/HotUtils"
import { isObject } from "typeguard"
import * as React from "react"

const
	Radium = require('radium'),
	log = getLogger(__filename),
	createReactProxy = require('react-proxy').default,
	deepUpdate = require('react-deep-force-update')

/**
 * Theme State interface for themed components
 */
export interface IThemedState {
	theme?:any
	styles?:any
	palette?:IPalette
	inputStyles?:any
	wrappedInstance?:any
	
	lastStyles?:any
	mounted?:boolean
	unsubscribe?:Function
}

export interface IThemedAttributes extends React.HTMLAttributes<any>{
	theme?:any
	styles?:any
	palette?:any
	enableComponentRef?:boolean
}

/**
 * Create themed styles
 *
 * @param baseStyles
 * @param themeKeys
 * @param props
 * @param theme
 * @returns {any}
 */
export function createThemedStyles(baseStyles:any,themeKeys:string[],props:any = {},theme = getTheme()) {

	// GET ALL THEME PARTS
	const
		themeParts = themeKeys.map(themeKey => _.get(theme,themeKey,{}))
	
	// MAP ALL STYLES
	let
		allStyles = [baseStyles,...themeParts,props.styles]
			.map(style => createStyles(style,null,theme))
	
	// MERGE
	return mergeStyles(...allStyles)
}




/**
 * Create a wrapped themed component
 *
 * @param Component
 * @param opts
 * @param baseStyles
 * @param themeKeys
 * @returns {any}
 */
export function makeThemedComponent(Component,opts:IThemedOptions = {},baseStyles = null,...themeKeys:string[]) {
	
	
	
	log.debug(`Decorating theme component `,Component)
	let
		skipRadium = opts.noRadium === true,
		enableRef = opts.enableRef === true
	
	const
		FinalComponent = skipRadium ? Component : Radium(Component),
		Instances = [],
		makeWrappedComponent = () => {
			//noinspection JSUnusedLocalSymbols
			return class ThemedWrapperComponent extends React.Component<any, IThemedState> {
				
				constructor(props,context) {
					super(props,context)
					
					this.state = this.getNewState(this.props,baseStyles)
				}
				
				// Used to unsubscribe from theme updates on unmount
				
				
				get wrappedComponent() {
					return Component
				}
				
				/**
				 * Create a new new theme state
				 */
				getNewState = (props, inputStyles, theme = getTheme(), palette = getPalette()) => {
					const
						newState = {
							theme,
							palette,
							inputStyles
						} as any
					
					if (inputStyles) {
						const
							styles = createThemedStyles(inputStyles,themeKeys,props,theme)
						
						Object.assign(newState,{styles})
						
						newState.lastStyles = inputStyles
					}
					
					return newState
				}
				
				
				
				/**
				 * Used as the subscriber for theme updates
				 * as well as by componentWillMount to
				 * create initial styles
				 */
				updateTheme(props = this.props, newTheme = getTheme(), newPalette = getPalette()) {
					
					const
						{state = {}} = this,
						{theme,palette} = state
					
					if (!props)
						props = this.props
					
					if (!theme || !palette || !isObject(theme) || !isObject(palette)) {
						log.warn(`Invalid theme & palette`, theme, palette)
						return
					}
					
					// IF ANY PARTS CHANGED - UPDATE
					if (
						/* THEME */ theme !== newTheme ||
						/* PALETTE */ palette !== newPalette ||
						/* PASSED PROP STYLES */ !shallowEquals(props.styles,this.props.styles)
					) {
						
						this.setState(
							this.getNewState(
								props || this.props,
								baseStyles,
								newTheme,
								newPalette
							)
						)
					}
					
				}
				
				
				
				/**
				 * Update the theme on mount and subscribe
				 */
				componentWillMount() {
					Instances.push(this)
					
					
					this.updateTheme()
					
				}
				
				
				shouldComponentUpdate(nextProps:any, nextState:IThemedState, nextContext:any):boolean {
					return !shallowEquals(this.props,nextProps) ||
						!shallowEquals(this.state,nextState,'theme','styles','palette') ||
						!shallowEquals(baseStyles,this.state.lastStyles)
				}
				
				/**
				 * If styles prop is passed and it has changed
				 * then update state
				 *
				 * @param nextProps
				 */
				componentWillReceiveProps(nextProps) {
					this.updateTheme(nextProps)
				}
				
				/**
				 * Unsubscribe from theme updates
				 */
				componentWillUnmount() {
					Instances.splice(Instances.indexOf(this),1)
					
				}
				
				/**
				 * Get the wrapped instance
				 *
				 * @returns {any}
				 */
				getWrappedInstance() {
					return getValue(() => this.state.wrappedInstance,null) as any
				}
				
				
				setWrappedInstanceRef = (wrappedInstance) => this.setState({wrappedInstance})
				
				render() {
					
					const
						{enableComponentRef,styles:propStyles} = this.props,
						styles = this.state.styles || propStyles || {},
						addRef = true // enableRef !== false || enableComponentRef
					
					return <FinalComponent
						{..._.omit(this.props,'styles','themedComponent','themedBaseStyles')}
						{..._.omit(this.state,'styles','inputStyles','wrappedInstance')}
						{...(addRef && {ref: this.setWrappedInstanceRef})}
						styles={styles} />
				}
			}
		}
	
	const
	 	ProxiedComponent = createReactProxy(makeWrappedComponent())
	
	let
		unsubscribe = EventHub.on(EventHub.ThemeChanged,(eventType,newTheme,newPalette) => {
			log.debug(`Updating themed component`,newTheme,getTheme(),newPalette,getPalette())
			ProxiedComponent.update(makeWrappedComponent())
			Instances.forEach(it => it.updateTheme(null,newTheme,newPalette))
			setTimeout(() => Instances.forEach(it => deepUpdate(it)),250)
		})
	
	addHotDisposeHandler(module,() => unsubscribe && unsubscribe())
	return ProxiedComponent.get() as any
	
	// const
	// 	WrappedComponent = makeWrappedComponent()
	//
	//return WrappedComponent as any
	//return PureRender(skipRadium ? WrappedComponent : Radium(WrappedComponent)) as any
	
}


export interface IThemedOptions {
	noRadium?:boolean,
	enableRef?:boolean
}

/**
 * Themed HOC
 *
 * @param Component
 * @returns {any}
 * @constructor
 */
export function Themed(Component) {
	return makeThemedComponent(Component) as any
}

/**
 * Themed component with options
 *
 * @param opts
 * @returns {(Component:any)=>any}
 * @constructor
 */
export function ThemedWithOptions(opts:IThemedOptions) {
	return function (Component) {
		return makeThemedComponent(Component,opts) as any
	}
}

/**
 * Themed component without a radium wrapper
 *
 * @param Component
 * @returns {any}
 * @constructor
 */
export function ThemedNoRadium(Component) {
	return makeThemedComponent(Component,{
		noRadium: true
	}) as any
}

/**
 * Themed styles
 *
 * @param opts
 * @param baseStyles
 * @param themeKeys
 * @returns {(Component:any)=>any}
 * @constructor
 */
export function ThemedStylesWithOptions(opts:IThemedOptions = {},baseStyles:any = {},...themeKeys:string[]) {
	return (Component) => {
		return makeThemedComponent(Component,opts,baseStyles,...themeKeys) as any
	}
}

/**
 * Same as Themed, but merges styles
 *
 * @param baseStyles
 * @param themeKeys
 * @returns {(Component:any)=>any}
 * @constructor
 */
export function ThemedStyles(baseStyles:any = {},...themeKeys:string[]) {
	return (Component) => {
		return makeThemedComponent(Component,{},baseStyles,...themeKeys) as any
	}
}

export function ThemedStylesNoRadium(baseStyles:any = {},...themeKeys:string[]) {
	return (Component) => {
		return makeThemedComponent(Component,{
			noRadium:true
		},baseStyles,...themeKeys) as any
	}
}

