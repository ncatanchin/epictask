

import {PureRender} from 'components/common/PureRender'
import {AppActionFactory as AppActionFactoryType} from '../actions/AppActionFactory'
import * as React from 'react'
import * as $ from 'jquery'

const log = getLogger(__filename)
const shortId = require('short-id')
import {create as FreeStyleCreate,FreeStyle} from 'free-style'

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
let appActions:AppActionFactoryType
let firstLoad = true

const themeListeners = []

export function addThemeListener(listener) {
	themeListeners.push(listener)

	return () => {
		const index = themeListeners.findIndex(item => item === listener)
		if (index > -1)
			themeListeners.splice(index,1)
	}
}



/**
 * Set the current theme
 *
 * @param newTheme
 */
export function setTheme(newTheme) {
	themeName = newTheme.name
	theme = newTheme

	const listenersCopy = [...themeListeners]
	listenersCopy.forEach(listener => listener(theme))

	// if (!firstLoad) {
	// 	if (!appActions) {
	// 		const AppActionFactory:typeof AppActionFactoryType = require('shared/actions/AppActionFactory')
	// 		appActions = new AppActionFactory()
	// 	}
	// 	//appActions.setTheme(newTheme)
	// }
}

export function getTheme() {
	return theme
}

function loadThemes() {
	log.info('Loading themes')

	Themes = require('./index')
	DefaultTheme = Themes[DefaultThemeName]
	setTheme(Themes[themeName || DefaultThemeName])
}

loadThemes()
firstLoad = false

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
		getNewState = () => {
			const newState = {
				theme: getTheme()
			}

			const themeParts = themeKeys
				.map(themeKey => _.get(getTheme(),themeKey,{}))

			const styles = mergeStyles(baseStyles,...themeParts)

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
		updateTheme = () => {
			if (this.state && this.state.theme === getTheme())
				return

			this.setState(this.getNewState())
		}

		componentWillMount() {
			this.updateTheme()
			this.unsubscribe = addThemeListener(this.updateTheme)
		}

		componentWillUnmount() {
			if (this.unsubscribe) {
				this.unsubscribe()
				this.unsubscribe = null
			}
		}

		render() {
			const ThemedComponent = Component as any
			return <ThemedComponent {...this.props} {...this.state} />
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




//
// export function Themed2<T>(component:ComponentClass<T>): ComponentClass<T> {
// 	return class extends Component<T,any> {
//
// 		private unsubscribe
//
// 		constructor(props:any = {}) {
// 			super(props)
//
// 			this.state = getThemeState()
// 		}
//
// 		updateTheme = () => this.setState(getThemeState())
//
// 		componentWillMount() {
// 			this.unsubscribe = addThemeListener(this.updateTheme)
// 		}
//
// 		componentWillUnmount() {
// 			if (this.unsubscribe) {
// 				this.unsubscribe()
// 				this.unsubscribe = null
// 			}
// 		}
//
// 		render() {
// 			const ThemedComponent = component as any
// 			return <ThemedComponent {...this.props} theme={this.state.theme}/>
// 		}
//
// 	}
// }

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
	module.hot.accept(['./index'],(updates) => {
		log.info(`Theme Updates, HMR`,updates)
		loadThemes()
	})
}
