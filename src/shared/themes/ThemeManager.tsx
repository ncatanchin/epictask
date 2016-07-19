

const log = getLogger(__filename)
import {AppActionFactory as AppActionFactoryType} from '../actions/AppActionFactory'
import * as React from 'react'


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

export interface IThemedState {
	theme?:any
	styles?:any
}

/**
 * Create a wrapped themed component
 *
 * @param Component
 * @param baseStyles
 * @param themeKey
 * @returns {any}
 */
export function makeThemedComponent(Component,baseStyles = null,themeKey:string = null) {
	return class extends React.Component<any, IThemedState> {

		// Used to unsubscribe from theme updates on unmount
		private unsubscribe

		/**
		 * Create a new new theme state
		 */
		getNewState = () => {
			const newState = {
				theme: getTheme()
			}

			if (baseStyles) {
				assign(newState,{
					styles: mergeStyles(
						baseStyles,
						themeKey ? _.get(getTheme(),themeKey) : getTheme()
					)
				})
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
 * @param themeKey
 * @returns {(Component:any)=>any}
 * @constructor
 */
export function ThemedStyles(baseStyles:any = {},themeKey:string = null) {
	return (Component) => {
		return makeThemedComponent(Component,baseStyles,themeKey)
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
	themeFontSize:makeThemeFontSize
})


if (module.hot) {
	module.hot.accept(['./index'],(updates) => {
		log.info(`Theme Updates, HMR`,updates)
		loadThemes()
	})
}
