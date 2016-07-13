

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

export interface IThemedProps {
	theme?:any
}


export const getThemeState = () => ({theme:getTheme()})

// export function Themed<T extends React.Component<any,any>>(component:T):T {
export function Themed(Component) {
	return class extends React.Component<any, IThemedProps> {
		private unsubscribe

		constructor(props:any = {},context:any = {}) {
			super(props,context)
			this.state = getThemeState()
		}

		updateTheme = () => this.setState(getThemeState())

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
			return <ThemedComponent {...this.props} theme={this.state.theme}/>
		}
	} as any
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
