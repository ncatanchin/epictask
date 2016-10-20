import * as assert from 'assert'
import {create as FreeStyleCreate,FreeStyle} from 'free-style'

import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import { TTheme } from "shared/themes/Theme"
import { IPalette } from "shared/themes/material/MaterialTools"
import { PersistentValue, PersistentValueEvent } from "shared/util/PersistentValue"
import { EnumEventEmitter } from "shared/util/EnumEventEmitter"


const
	log = getLogger(__filename),
	shortId = require('short-id')

// if (log.setOverrideLevel)
// 	log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Define our dark palette
 */

export const
	PersistentThemeName = new PersistentValue<string>('epictask-theme'),
	PersistentPaletteName = new PersistentValue<string>('epictask-palette'),
	DefaultThemeName = PersistentThemeName.get() || 'DarkTheme',
	DefaultPaletteName = PersistentPaletteName.get() ||  'DarkPalette'

// ONLY LET FOR HMR
export let
	Themes:{[ThemeName:string]:IThemeCreator} = null,
	Palettes:{[PaletteName:string]:IPaletteCreator} = null,
	DefaultTheme = null,
	DefaultPalette = null

// Internal ref to the current theme
const
	ThemeState = getHot(module,'ThemeState',{
		themeName: null as any,
		theme:null as any,
		paletteName: null as string,
		palette:null as any
	})


/**
 * Theme listener type, eventually will be typed
 */
export type TThemeListener = (theme:any,palette:IPalette) => any


/**
 * All listeners
 *
 * @type {TThemeListener[]}
 */
const
	themeListeners = getHot(module,'themeListeners',[]) as TThemeListener[]

//log.info(`Using theme listeners at start`,themeListeners)

export enum ThemeEvent {
	Changed
}

/**
 * Event emitter for user theme changed=s
 *
 * @type {EnumEventEmitter<ThemeEvent>}
 */
export const ThemeEvents = new EnumEventEmitter<ThemeEvent>(ThemeEvent)

/**
 * Add a theme listener
 *
 * @param listener
 * @returns {()=>undefined}
 */
export function addThemeListener(listener:TThemeListener) {
	themeListeners.push(listener)
	
	return () => {
		const
			index = themeListeners.findIndex(item => item === listener)
		
		if (index > -1)
			themeListeners.splice(index,1)
	}
}

/**
 * Notify all listeners of update
 */
function notifyListeners(newTheme:TTheme,newPalette:IPalette) {
	const listenersCopy = [...themeListeners]
	//log.info(`Notifying listeners`,listenersCopy,'of new theme',newTheme)
	listenersCopy.forEach(listener => listener(newTheme,newPalette))
}

function loadDefaultPalette() {
	return require('./available/DarkPalette').default
}

/**
 * Palette creator interface
 */
	
export interface IPaletteCreator {
	(): IPalette
	PaletteName:string
}

/**
 * Theme Creator interface
 */
export interface IThemeCreator {
	(palette:IPalette): TTheme
	ThemeName:string
}

/**
 * Set the current palette
 *
 * @param newPalette
 */
function setPalette(newPalette:IPaletteCreator) {
	if (!newPalette) {
		log.error(`Null theme, requiring dark palette directly`,newPalette)
		newPalette = loadDefaultPalette()
	}
	
	assert(_.isFunction(newPalette),`Palette MUST be a function`)
	
	const
		palette = newPalette()
	
	Object.assign(ThemeState,{
		paletteName: newPalette.PaletteName,
		palette
	})
	
	PersistentPaletteName.set(ThemeState.paletteName)
	
	// Assign app props to the body & to html
	notifyListeners(getTheme(),palette)
}

/**
 * Change palette at runtime
 *
 * @param creator
 */
export function setPaletteCreator(creator:IPaletteCreator) {
	setPalette(creator)
	ThemeEvents.emit(ThemeEvent.Changed)
}


/**
 * Set the current theme
 *
 * @param newThemeCreator
 */
function setTheme(newThemeCreator:IThemeCreator) {
	if (!newThemeCreator) {
		log.error(`Null theme, requiring dark theme directly`,newThemeCreator)
		newThemeCreator = require('./available/DarkTheme').default
	}
	
	assert(_.isFunction(newThemeCreator),`Theme MUST be a function`)
	
	const
		palette = ThemeState.palette || loadDefaultPalette()()
	
	const
		newTheme = newThemeCreator(palette)
	
	Object.assign(ThemeState,{
		themeName: newTheme.ThemeName,
		theme: newTheme
	})
	
	PersistentThemeName.set(ThemeState.themeName)
	
	// Assign app props to the body & to html
	try {
		$('html,body').css(newTheme.app)
		// Object.assign(document.getElementsByTagName('body')[ 0 ].style, newTheme.app)
	} catch (err) {}
	
	notifyListeners(newTheme,palette)
	
}


/**
 * Change Theme at runtime
 *
 * @param creator
 */
export function setThemeCreator(creator:IThemeCreator) {
	setTheme(creator)
	ThemeEvents.emit(ThemeEvent.Changed)
}


export function getTheme() {
	return ThemeState.theme
}

/**
 * Get a theme creator
 *
 * @param name
 * @returns {IThemeCreator}
 */
export function getThemeCreator(name:string) {
	return Themes[name]
}

/**
 * Get all available theme names
 *
 * @returns {string[]}
 */
export function getThemeNames() {
	return Object.keys(Themes)
}

/**
 * Get the current theme name
 *
 * @returns {any}
 */
export function getThemeName() {
	return ThemeState.themeName
}

export function getPalette() {
	return ThemeState.palette
}

export function getPaletteCreator(name:string) {
	return Palettes[name]
}


export function getPaletteName() {
	return ThemeState.paletteName
}

export function getPalettes() {
	return Object.values(Palettes)
}

export function getPaletteNames() {
	return Object.keys(Palettes)
}

export function forceThemeUpdate() {
	setTheme(_.cloneDeep(getTheme()))
}

function loadThemesAndPalettes() {
	log.info('Loading themes')
	
	const
		ctx = require.context('./available',true,/(Palette$|Palette\.[tj]sx?$|Theme$|Theme\.[tj]sx?$)/),
		keys = ctx.keys()
	
	
	Themes = {}
	Palettes = {}
	
	keys
		.filter(key => /Palette/.test(key))
		.map(key => {
			let
				mod = ctx(key) as any
			
			mod = mod.default || mod
			
			log.info(`Loaded`,key,'got',mod)
			return mod
		})
		.filter(mod => mod.PaletteName && _.isFunction(mod))
		.forEach(mod => {
			Palettes[mod.PaletteName] = mod
		})
	
	
	// Set the default palettes
	log.info(`Loaded palettes`,Palettes)
	DefaultPalette = Palettes[DefaultPaletteName]
	
	
	
	keys
		.filter(key => /Theme/.test(key))
		.map(key => {
			let
				mod = ctx(key) as any
			
			mod = mod.default || mod
			
			log.info(`Loaded`,key,'got',mod)
			return mod
		})
		.filter(mod => mod.ThemeName && _.isFunction(mod))
		.forEach(mod => {
			Themes[mod.ThemeName] = mod
		})
	
	
	// Set the default theme
	log.info(`Loaded themes`,Themes)
	DefaultTheme = Themes[DefaultThemeName]
	
	
	
	// If this is a reload then grab the theme name from the hot data
	ThemeState.themeName = getHot(module,'themeName',DefaultThemeName)
	
	setPalette(Palettes[ThemeState.paletteName] || DefaultPalette)
	setTheme(Themes[ThemeState.themeName] || DefaultTheme)
	
	if (module.hot) {
		module.hot.accept([ctx.id],(updates) => {
			log.info(`HMR Theme Update`)
			loadThemesAndPalettes()
		})
	}
}

loadThemesAndPalettes()

/**
 * Listen for palette changes
 */
PersistentPaletteName.on(PersistentValueEvent.Changed,() => {
	const
		paletteName = PersistentPaletteName.get()
	
	log.debug(`Changing palette from notification to ${paletteName}`)
	if (ThemeState.paletteName === paletteName) {
		log.debug(`Current palette is already ${paletteName}`)
		return
	}
	const
		paletteCreator = Palettes[paletteName]
	
	log.debug(`Setting new palette`,paletteCreator,paletteName)
	setPaletteCreator(paletteCreator)
})



/**
 * Listen for palette changes
 */
PersistentThemeName.on(PersistentValueEvent.Changed,() => {
	const
		themeName = PersistentThemeName.get()
	
	log.debug(`Changing theme from notification to ${themeName}`)
	if (ThemeState.themeName === themeName) {
		log.debug(`Current theme is already ${themeName}`)
		return
	}
	setThemeCreator(Themes[themeName])
})


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



// Export globals
Object.assign(global as any,{
	getTheme,
	getPalette,
	themeFontSize:makeThemeFontSize,
	CreateGlobalThemedStyles
})


// HMR CONFIG
setDataOnHotDispose(module,() => ({
	ThemeState,
	themeListeners
}))
