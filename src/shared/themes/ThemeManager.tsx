
import './styles'
import * as Radium from 'radium'
import * as React from 'react'
import * as $ from 'jquery'

const log = getLogger(__filename)
const shortId = require('short-id')
import {create as FreeStyleCreate,FreeStyle} from 'free-style'
import {mergeStyles} from "shared/themes/styles/CommonStyles"
import {PureRender} from "ui/components/common/PureRender"
import { postConstructorDecorate, interceptFn } from "shared/util"
//import {interceptFn} from "shared/util/ObjectUtil"
//import {PureRender} from "ui/components/common/PureRender"

/**
 * Define our dark palette
 */

export const DefaultThemeName = 'DarkTheme'

// ONLY LET FOR HMR
export let Themes = null
export let DefaultTheme = null

// Internal ref to the current theme
let theme = null
let themeName = DefaultThemeName

/**
 * Theme listener type, eventually will be typed
 */
export type TThemeListener = (theme:any) => void

// Internal listener list
const themeListeners = _.get(module,'hot.data.themeListeners',[]) as TThemeListener[]


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
function notifyListeners() {
	const listenersCopy = [...themeListeners]
	listenersCopy.forEach(listener => listener(theme))
}


/**
 * Set the current theme
 *
 * @param newTheme
 */
export function setTheme(newTheme) {
	themeName = newTheme.name
	theme = newTheme
	
	// Assign app props to the body & to html
	Object.assign(document.getElementsByTagName('html')[0].style,theme.app)
	Object.assign(document.getElementsByTagName('body')[0].style,theme.app)
	
	notifyListeners()

}

export function getTheme() {
	return theme
}

function loadThemes() {
	log.info('Loading themes')

	Themes = require('./index')
	
	// Set the default theme
	DefaultTheme = Themes[DefaultThemeName]
	
	// If this is a reload then grab the theme name from the hot data
	themeName = (_.get(module,'hot.data.themeName') || DefaultThemeName) as string
	
	setTheme(Themes[themeName || DefaultThemeName])
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
}

export function createThemedStyles(baseStyles:any,themeKeys:string[],props:any = {}) {
	
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
	
	// const WrappedComponent = postConstructorDecorate(Component.name + "Themed",Component,(instance:typeof Component,args:any[]) => {
	//
	// 	/**
	// 	 * Create a new state Object
	// 	 *
	// 	 * @param props
	// 	 * @returns {{theme: null}}
	// 	 */
	// 	function makeState(props) {
	// 		const
	// 			newState = {
	// 				theme: getTheme()
	// 			},
	// 			styles = createThemedStyles(baseStyles,themeKeys,props)
	//
	// 		if (baseStyles) {
	// 			Object.assign(newState,{styles})
	// 		}
	//
	// 		return newState
	// 	}
	//
	// 	/**
	// 	 * Update the theme
	// 	 *
	// 	 * @param props
	// 	 * @param force
	// 	 */
	// 	function updateTheme(props = instance.props, force = false) {
	// 		if (instance.state && _.isEqual(instance.state.theme, getTheme()))
	// 			return
	//
	// 		instance.setState(makeState(props), () => instance.forceUpdate())
	// 	}
	//
	// 	let unsubscribe = null
	//
	// 	interceptFn(instance,{
	//
	// 		componentWillMount: function(origFn) {
	// 			updateTheme()
	// 			unsubscribe = addThemeListener(() => updateTheme(instance.props,true))
	// 			origFn()
	// 		},
	//
	// 		forceUpdate(origFn,callback?:() => any) {
	// 			updateTheme(instance.props,true)
	// 			origFn(callback)
	// 		},
	//
	// 		/**
	// 		 * If styles prop is passed and it has changed
	// 		 * then update state
	// 		 *
	// 		 * @param origFn
	// 		 * @param nextProps
	// 		 */
	// 		componentWillReceiveProps(origFn,nextProps) {
	// 			if (instance.props.styles !== nextProps.styles)
	// 				updateTheme(nextProps)
	//
	// 			origFn(nextProps)
	// 		},
	//
	// 		/**
	// 		 * Unsubscribe from theme updates
	// 		 */
	// 		componentWillUnmount(origFn) {
	// 			if (unsubscribe) {
	// 				unsubscribe()
	// 				unsubscribe = null
	// 			}
	//
	// 			origFn()
	// 		}
	// 	})
	//
	// 	return instance
	// })
	
	const FinalComponent = skipRadium ? Component : Radium(Component)
	
	const WrappedComponent = class extends React.Component<any, IThemedState> {

		constructor(props,context) {
			super(props,context)

			this.state = this.getNewState(this.props)
		}

		// Used to unsubscribe from theme updates on unmount
		private unsubscribe

		get wrappedComponent() {
			return Component
		}

		/**
		 * Create a new new theme state
		 */
		getNewState = (props) => {
			const newState = {
				theme: getTheme()
			}

			const styles = createThemedStyles(baseStyles,themeKeys,props)

			if (baseStyles) {
				Object.assign(newState,{styles})
			}

			return newState
		}



		/**
		 * Used as the subscriber for theme updates
		 * as well as by componentWillMount to
		 * create initial styles
		 */
		updateTheme(props = this.props, force = false) {
			if (this.state && (_.isEqual(this.state.theme, getTheme()) || this.state.theme === getTheme()))
				return

			this.setState(this.getNewState(props), () => this.forceUpdate())
		}

		/**
		 * Update the theme on mount and subscribe
		 */
		componentWillMount() {
			this.updateTheme()
			this.unsubscribe = addThemeListener(() => this.updateTheme(this.props,true))
		}

		forceUpdate(callback?:() => any) {
			this.updateTheme(this.props,true)
			super.forceUpdate(callback)
		}

		/**
		 * If styles prop is passed and it has changed
		 * then update state
		 *
		 * @param nextProps
		 */
		componentWillReceiveProps(nextProps) {
			if (this.props.styles !== nextProps.styles)
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

		render() {
			
				
			//const ThemedComponent = Component as any
			//return <ThemedComponent {..._.omit(this.props,'styles')} {...this.state} />
			return <FinalComponent {..._.omit(this.props,'styles')} {...this.state} />
		}
	}
	
	PureRender(WrappedComponent)
	
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


if (module.hot) {
	module.hot.dispose((data:any) => {
		Object.assign(data,{
			themeName,
			themeListeners
		})
	})
	
	module.hot.accept(() => log.info(`HMR Update`))
	// module.hot.accept(['./index'],(updates) => {
	// 	log.info(`Theme Updates, HMR`,updates)
	// 	loadThemes()
	// })
}
