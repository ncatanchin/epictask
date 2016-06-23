

const log = getLogger(__filename)
import {AppActionFactory as AppActionFactoryType} from 'shared/actions/AppActionFactory'


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

/**
 * Set the current theme
 *
 * @param newTheme
 */
export function setTheme(newTheme) {
	themeName = newTheme.name
	theme = newTheme

	if (!firstLoad) {
		if (!appActions) {
			const AppActionFactory:typeof AppActionFactoryType = require('shared/actions/AppActionFactory')
			appActions = new AppActionFactory()
		}
		appActions.setTheme(newTheme)
	}
}

export function getTheme() {
	return theme
}

function loadThemes() {
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
