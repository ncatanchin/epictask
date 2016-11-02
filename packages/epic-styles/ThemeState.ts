import { getHot, setDataOnHotDispose, PersistentValue, PersistentValueEvent, EnumEventEmitter } from "epic-global"
import { TTheme } from "./Theme"
import { IPalette } from "./material"

const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Define our dark palette
 */

export const
	PersistentThemeName = new PersistentValue<string>('epictask-theme'),
	PersistentPaletteName = new PersistentValue<string>('epictask-palette'),
	
	DefaultThemeName = PersistentThemeName.get() || 'DefaultTheme',
	DefaultPaletteName = PersistentPaletteName.get() ||  'LightPalette'

// ONLY LET FOR HMR
export let
	ThemeCreators:{[ThemeName:string]:IThemeCreator} = null,
	PaletteCreators:{[PaletteName:string]:IPaletteCreator} = null,
	DefaultTheme:IThemeCreator = null,
	DefaultPalette:IPaletteCreator = null

// Internal ref to the current theme
const
	ThemeState = getHot(module,'ThemeState',{
		themeName: null as any,
		theme:null as any,
		paletteName: null as string,
		palette:null as any
	})


/**
 * Global theme access
 *
 * @returns {any}
 */
export function getTheme() {
	return ThemeState.theme
}

/**
 * Global palette access
 *
 * @returns {any}
 */
export function getPalette() {
	return ThemeState.palette
}

assignGlobal({
	getTheme,
	getPalette,
})



import * as BuiltInsType from "./builtin"

let
	BuiltIns:typeof BuiltInsType = null




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
	(palette:IPalette,baseTheme?:TTheme): TTheme
	ThemeName:string
	BaseThemeName?:string
}

/**
 * Set the current palette
 *
 * @param newPalette
 */
function setPalette(newPalette:IPaletteCreator) {
	if (!newPalette) {
		log.error(`Null theme, requiring dark palette directly`,newPalette)
		newPalette = BuiltIns.LightPalette
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
		newThemeCreator = DefaultTheme
	}
	
	assert(_.isFunction(newThemeCreator),`Theme MUST be a function`)
	
	const
		palette = ThemeState.palette || DefaultPalette()
	
	const
		{BaseThemeName} = newThemeCreator,
		newBaseTheme = BaseThemeName && ThemeCreators[BaseThemeName] && ThemeCreators[BaseThemeName](palette),
		newTheme = newThemeCreator(palette,newBaseTheme)
	
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



/**
 * Get a theme creator
 *
 * @param name
 * @returns {IThemeCreator}
 */
export function getThemeCreator(name:string) {
	return ThemeCreators[name]
}

/**
 * Get all available theme names
 *
 * @returns {string[]}
 */
export function getThemeNames() {
	return Object.keys(ThemeCreators)
}

/**
 * Get the current theme name
 *
 * @returns {any}
 */
export function getThemeName() {
	return PersistentThemeName.get()
}


export function getPaletteCreator(name:string) {
	return PaletteCreators[name]
}


export function getPaletteName() {
	return PersistentPaletteName.get()
}

export function getPalettes() {
	return Object.values(PaletteCreators)
}

export function getPaletteNames() {
	return Object.keys(PaletteCreators)
}

export function forceThemeUpdate() {
	setTheme(_.cloneDeep(getTheme()))
}



function loadBuiltIns() {
	BuiltIns = require('./builtin')
	
	DefaultTheme = BuiltIns.DefaultTheme
	DefaultPalette = BuiltIns.LightPalette
	
	ThemeCreators = {
		DefaultTheme: BuiltIns.DefaultTheme,
		//LightTheme: BuiltIns.LightTheme
	}
	
	PaletteCreators = {
		LightPalette: BuiltIns.LightPalette,
		DarkPalette: BuiltIns.DarkPalette
	}
	
	//ThemeState.themeName = DefaultThemeName
	
	setPalette(currentPaletteCreator())
	setTheme(currentThemeCreator())
	
	
}

/**
 * Get the current palette creator or default if not available
 *
 * @returns {IPaletteCreator|any}
 */
export function currentPaletteCreator() {
	return PaletteCreators[getPaletteName()] || DefaultPalette || PaletteCreators['DarkPalette']
}

/**
 * Get the current theme creator
 *
 * @returns {IThemeCreator}
 */
export function currentThemeCreator() {
	return ThemeCreators[getThemeName()] || DefaultTheme || ThemeCreators['DefaultTheme']
}

loadBuiltIns()

if (module.hot) {
	module.hot.accept(['./builtin'],loadBuiltIns)
}


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
		paletteCreator = PaletteCreators[paletteName]
	
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
	setThemeCreator(ThemeCreators[themeName])
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



// Export globals
assignGlobal({
	
	themeFontSize:makeThemeFontSize
})


// HMR CONFIG
setDataOnHotDispose(module,() => ({
	ThemeState,
	themeListeners
}))
