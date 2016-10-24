
import * as React from 'react'
import { mergeStyles } from "./styles/CommonRules"
import { addThemeListener } from "./ThemeState"
import { getValue, shallowEquals } from  "epic-common"
import { IPalette } from "./material"

const
	Radium = require('radium'),
	log = getLogger(__filename)

/**
 * Theme State interface for themed components
 */
export interface IThemedState {
	theme?:any
	styles?:any
	palette?:IPalette
	inputStyles?:any
	wrappedInstance?:any
	mounted?:boolean
}

export interface IThemedAttributes extends React.HTMLAttributes<any>{
	theme?:any
	styles?:any
	palette?:any
	
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
 * @param skipRadium
 * @param baseStyles
 * @param themeKeys
 * @returns {any}
 */
export function makeThemedComponent(Component,skipRadium = false,baseStyles = null,...themeKeys:string[]) {
	
	log.debug(`Decorating theme component `,Component)
	let
		lastStyles = null
	
	const
		FinalComponent = skipRadium ? Component : Radium(Component),
		
		WrappedComponent =
			//noinspection JSUnusedLocalSymbols
			class ThemedWrapperComponent extends React.Component<any, IThemedState> {
				
				mounted = false
				
				constructor(props,context) {
					super(props,context)
					
					this.state = this.getNewState(this.props,baseStyles)
				}
				
				// Used to unsubscribe from theme updates on unmount
				private unsubscribe
				
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
						}
						
					if (inputStyles) {
						const
							styles = createThemedStyles(inputStyles,themeKeys,props,theme)
						
						Object.assign(newState,{styles})
						
						lastStyles = inputStyles
					}
					
					return newState
				}
				
				
				
				/**
				 * Used as the subscriber for theme updates
				 * as well as by componentWillMount to
				 * create initial styles
				 */
				updateTheme(props = this.props, newTheme = getTheme(), newPalette = getPalette()) {
					if (!this.mounted)
						return
					
					// IF ANY PARTS CHANGED - UPDATE
					if (
						// THEME
						!getValue(() => this.state.theme) !== newTheme ||
						
						// PALETTE
						!getValue(() => this.state.palette) !== newPalette ||
						
						// BASE STYLES FROM COMPONENT
						//!_.isEqual(baseStyles,lastStyles) ||
						
						// PASSED PROP STYLES
						!shallowEquals(props.styles,this.props.styles)
					) {
						
						this.setState(this.getNewState(props,baseStyles,newTheme,newPalette),() => {
							// try {
							// 	const
							// 		instance = this.getWrappedInstance()
							//
							// 	instance && instance.forceUpdate()
							// }	catch (err) {
							// 	log.warn(`failed to updated wrapped component`)
							// }
						})
					}
					
				}
				
				
				/**
				 * Update the theme on mount and subscribe
				 */
				componentWillMount() {
					this.mounted = true
					
					this.updateTheme()
					
					this.unsubscribe = addThemeListener(
						(newTheme,newPalette) =>this.updateTheme(this.props,newTheme,newPalette))
						
				}
				
				
				shouldComponentUpdate(nextProps:any, nextState:IThemedState, nextContext:any):boolean {
					return !shallowEquals(this.props,nextProps) ||
						!shallowEquals(this.state,nextState,'theme','styles','palette') ||
							!shallowEquals(baseStyles,lastStyles)
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
					this.mounted = false
					
					if (this.unsubscribe) {
						this.unsubscribe()
						this.unsubscribe = null
					}
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
						styles = this.state.styles || this.props.styles || {}
					
					return <FinalComponent
						{..._.omit(this.props,'styles','themedComponent','themedBaseStyles')}
						{..._.omit(this.state,'styles','inputStyles','wrappedInstance')}
						styles={styles}
						ref={this.setWrappedInstanceRef} />
				}
			}
		
	return WrappedComponent as any
	//return PureRender(skipRadium ? WrappedComponent : Radium(WrappedComponent)) as any
	
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

export function ThemedNoRadium(Component) {
	return makeThemedComponent(Component,true) as any
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
		return makeThemedComponent(Component,false,baseStyles,...themeKeys) as any
	}
}

export function ThemedStylesNoRadium(baseStyles:any = {},...themeKeys:string[]) {
	return (Component) => {
		return makeThemedComponent(Component,true,baseStyles,...themeKeys) as any
	}
}

