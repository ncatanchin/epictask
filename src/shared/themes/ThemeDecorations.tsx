
import * as React from 'react'
import { mergeStyles } from "shared/themes/styles/CommonStyles"
import { addThemeListener } from "shared/themes/ThemeState"
import { getValue, shallowEquals } from "shared/util/ObjectUtil"

const
	Radium = require('radium'),
	log = getLogger(__filename)

/**
 * Theme State interface for themed components
 */
export interface IThemedState {
	theme?:any
	styles?:any
	inputStyles?:any
	wrappedInstance?:any
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
		themeParts = themeKeys.map(themeKey => getValue(() => theme[themeKey],{}))
	
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
	
	const
		FinalComponent = skipRadium ? Component : Radium(Component),
		
		WrappedComponent =
			//noinspection JSUnusedLocalSymbols
			class ThemedWrapperComponent extends React.Component<any, IThemedState> {
				
				constructor(props,context) {
					super(props,context)
					
					this.state = this.getNewState(this.props,this.getBaseStyles())
				}
				
				// Used to unsubscribe from theme updates on unmount
				private unsubscribe
				
				get wrappedComponent() {
					return Component
				}
				
				/**
				 * Create a new new theme state
				 */
				getNewState = (props, inputStyles, theme = getTheme()) => {
					const
						newState = {
							theme,
							inputStyles
						}
						
					if (inputStyles) {
						const
							styles = createThemedStyles(inputStyles,themeKeys,props,theme)
						
						Object.assign(newState,{styles})
					}
					
					return newState
				}
				
				
				
				/**
				 * Used as the subscriber for theme updates
				 * as well as by componentWillMount to
				 * create initial styles
				 */
				updateTheme(props = this.props, newTheme = getTheme()) {
					
					const
						inputStyles = this.getBaseStyles()
					
					if (
						// Check for theme changes
					getValue(() => this.state.theme) !== newTheme ||
					getValue(() => this.state.inputStyles) !== inputStyles ||
					// Check for style changes
					_.isEqual(_.pick(props,'styles'),_.pick(this.props,'styles'))
					) {
						//log.debug(`Updating state`)
						this.setState(this.getNewState(props,inputStyles,newTheme), () => this.forceUpdate())
					}
					
				}
				
				
				/**
				 * Update the theme on mount and subscribe
				 */
				componentWillMount() {
					this.updateTheme()
					this.unsubscribe = addThemeListener(
						(newTheme) => this.updateTheme(this.props,newTheme))
				}
				
				
				shouldComponentUpdate(nextProps:any, nextState:IThemedState, nextContext:any):boolean {
					return !shallowEquals(this.props,nextProps) ||
						!shallowEquals(this.state,nextState,'theme','styles') ||
						this.getBaseStyles() !== getValue(() => this.state.inputStyles)
				}
				
				/**
				 * If styles prop is passed and it has changed
				 * then update state
				 *
				 * @param nextProps
				 */
				componentWillReceiveProps(nextProps) {
					if (this.props.styles !== nextProps.styles || getValue(() => this.state.inputStyles) !== this.getBaseStyles())
						this.updateTheme(nextProps)
				}
				
				/**
				 * Unsubscribe from theme updates
				 */
				componentWillUnmount() {
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
				
				getBaseStyles() {
					const
						instance = this.getWrappedInstance()
					
					return (instance && instance.baseStyles) || baseStyles
				}
				
				setWrappedInstanceRef = (wrappedInstance) => this.setState({wrappedInstance})
				
				render() {
					
					return <FinalComponent
						{..._.omit(this.props,'styles','themedComponent','themedBaseStyles')}
						{..._.omit(this.state,'inputStyles')}
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

