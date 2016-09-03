

import {PureRender} from 'components/common/PureRender'
import * as React from 'react'
import * as $ from 'jquery'

const log = getLogger(__filename)
const shortId = require('short-id')
import {create as FreeStyleCreate,FreeStyle} from 'free-style'
import {mergeStyles} from "shared/themes/styles/CommonStyles"

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

	_.assign(config, {
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


/**
 * Create a wrapped themed component
 *
 * @param Component
 * @param baseStyles
 * @param themeKeys
 * @returns {any}
 */
export function makeThemedComponent(Component,baseStyles = null,...themeKeys:string[]) {


	const ThemedWrapper = class extends React.Component<any, IThemedState> {

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

			const
				themeParts = themeKeys
					.map(themeKey => _.get(getTheme(),themeKey,{})),
				styles = mergeStyles(baseStyles,...themeParts,props.styles)

			if (baseStyles) {
				assign(newState,{styles})
			}

			return newState
		}



		/**
		 * Used as the subscriber for theme updates
		 * as well as by componentWillMount to
		 * create initial styles
		 */
		updateTheme = (props = this.props) => {
			if (this.state && this.state.theme === getTheme())
				return

			this.setState(this.getNewState(props), () => this.forceUpdate())
		}
		
		/**
		 * Update the theme on mount and subscribe
		 */
		componentWillMount() {
			this.updateTheme()
			this.unsubscribe = addThemeListener(this.updateTheme)
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
			const ThemedComponent = Component as any
			return <ThemedComponent {..._.omit(this.props,'styles')} {...this.state} />
		}
	} as any

	return PureRender(ThemedWrapper)
}

/**
 * Themed HOC
 *
 * @param Component
 * @returns {any}
 * @constructor
 */
export function Themed(Component) {
	return makeThemedComponent(Component)
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
		return makeThemedComponent(Component,baseStyles,...themeKeys)
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
	module.hot.accept(['./index'],(updates) => {
		log.info(`Theme Updates, HMR`,updates)
		loadThemes()
	})
}
