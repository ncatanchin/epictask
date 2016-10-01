
import './styles'
import * as Radium from 'radium'
import * as React from 'react'
import * as $ from 'jquery'

import {create as FreeStyleCreate,FreeStyle} from 'free-style'
import {mergeStyles} from "shared/themes/styles/CommonStyles"
import {PureRender} from "ui/components/common/PureRender"
import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import { TTheme } from "shared/themes/Theme"
import { shallowEquals, getValue, interceptFn } from "shared/util/ObjectUtil"

const
	log = getLogger(__filename),
	shortId = require('short-id')

// if (log.setOverrideLevel)
// 	log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Define our dark palette
 */

export const DefaultThemeName = 'DarkTheme'

// ONLY LET FOR HMR
export let
	Themes:{[ThemeName:string]:TTheme} = null,
	DefaultTheme = null

// Internal ref to the current theme
const
	ThemeState = getHot(module,'ThemeState',{
		themeName: null as any,
		theme:null as any
	})


/**
 * Theme listener type, eventually will be typed
 */
export type TThemeListener = (theme:any) => void


/**
 * All listeners
 *
 * @type {TThemeListener[]}
 */
const
	themeListeners = getHot(module,'themeListeners',[]) as TThemeListener[]

//log.info(`Using theme listeners at start`,themeListeners)

/**
 * Add a theme listener
 *
 * @param listener
 * @returns {()=>undefined}
 */
export function addThemeListener(listener) {
	themeListeners.push(listener)

	return () => {
		const index = themeListeners.findIndex(item => item === listener)
		if (index > -1)
			themeListeners.splice(index,1)
	}
}

/**
 * Notify all listeners of update
 */
function notifyListeners(newTheme:TTheme) {
	const listenersCopy = [...themeListeners]
	//log.info(`Notifying listeners`,listenersCopy,'of new theme',newTheme)
	listenersCopy.forEach(listener => listener(newTheme))
}


/**
 * Set the current theme
 *
 * @param newTheme
 */
export function setTheme(newTheme:TTheme) {
	if (!newTheme) {
		log.error(`Null theme, requiring dark theme directly`,newTheme)
		newTheme = require('./available/DarkTheme').default
	}
	Object.assign(ThemeState,{
		themeName: newTheme.ThemeName,
		theme: newTheme
	})
	
	// Assign app props to the body & to html
	try {
		Object.assign(document.getElementsByTagName('html')[ 0 ].style, ThemeState.theme.app)
		Object.assign(document.getElementsByTagName('body')[ 0 ].style, ThemeState.theme.app)
	} catch (err) {}
	notifyListeners(newTheme)

}

export function getTheme() {
	return ThemeState.theme
}

export function forceThemeUpdate() {
	setTheme(_.cloneDeep(getTheme()))
}

function loadThemes() {
	log.info('Loading themes')

	const
		ctx = require.context('./available',true,/(Theme$|Theme\.(js)sx?$)/)
	
	Themes = ctx.keys()
		.map(key => {
			const
				themeMod = ctx(key) as any,
				mod = themeMod.default || themeMod
			
			log.info(`Loaded`,key,'got',mod)
			return mod
		})
		.filter(themeMod => themeMod.ThemeName)
		.reduce((themeMap,themeMod) => {
			themeMap[ themeMod.ThemeName ] = themeMod
			return themeMap
		},{})
	
	log.info(`Loaded themes`,Themes)
	
	// Set the default theme
	DefaultTheme = Themes[DefaultThemeName]
	
	// If this is a reload then grab the theme name from the hot data
	ThemeState.themeName = getHot(module,'themeName',DefaultThemeName)
	
	setTheme(Themes[ThemeState.themeName] || DefaultTheme)
	
	if (module.hot) {
		module.hot.accept([ctx.id],(updates) => {
			log.info(`HMR Theme Update`)
			loadThemes()
		})
	}
}

loadThemes()

/**
 * Create a font size based on the themes font size
 *
 * This is needed due to the fact that font sizes
 * can vary between fonts so dramatically,
 * best example is Roboto and FiraCode
 *
 * @param multiplier
 * @returns {number}
 */
export function makeThemeFontSize(multiplier:number) {
	return getTheme().fontSize * multiplier
}


const globalStyleConfigs = [] as any


export interface IGlobalThemedStyle {
	id:string
	fn:(theme:any,Style:FreeStyle) => any
	remove:() => void
	create: () => void
	element: typeof $
	clean:() => void
}

export function CreateGlobalThemedStyles(fn:(theme:any,Style:FreeStyle) => any):IGlobalThemedStyle {

	const
		id = `themedStyle${shortId.generate()}`,
		config = {} as any,
		remove = () => $(`#${id}`).remove(),
		create = () => {
			remove()
			const
				Style = FreeStyleCreate(),
				newStyles = fn(getTheme(),Style)


			Object
				.keys(newStyles)
				.forEach(selector => Style.registerRule(selector,newStyles[selector]))


			return $(`<style id="${id}" type="text/css">
				${Style.getStyles()}
			</style>`).appendTo($('head'))
		}
	
	Object.assign(config, {
		id,
		fn,
		remove,
		create,
		element: create(),
		removeListener: addThemeListener(() => {
			config.create()
		}),
		clean() {
			if (!config.removeListener)
				throw new Error(`ThemeStyle has already been remove ${id}`)

			config.removeListener()
			config.removeListener = null
			config.remove()
		}
	})

	globalStyleConfigs.push(config)

	return config

}

/**
 * Theme State interface for themed components
 */
export interface IThemedState {
	theme?:any
	styles?:any
	inputStyles?:any
	wrappedInstance?:any
}

export function createThemedStyles(baseStyles:any,themeKeys:string[],props:any = {},theme = getTheme()) {
	
	const themeParts = themeKeys.map(themeKey => _.get(getTheme(),themeKey,{}))
	
	return mergeStyles(baseStyles,...themeParts,props.styles)
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
	
		WrappedComponent = class ThemedWrapperComponent extends React.Component<any, IThemedState> {
			
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


/**
 * Export getTheme globally
 *
 * @global getTheme
 */

declare global {
	//noinspection JSUnusedLocalSymbols
	let getTheme:any
	//noinspection JSUnusedLocalSymbols
	let themeFontSize:typeof makeThemeFontSize
}


// Export globals
Object.assign(global as any,{
	getTheme,
	themeFontSize:makeThemeFontSize,
	CreateGlobalThemedStyles
})


// HMR CONFIG
setDataOnHotDispose(module,() => ({
	ThemeState,
	themeListeners
}))

acceptHot(module,log)
