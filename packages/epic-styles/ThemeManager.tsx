
import './styles'
import { acceptHot, addHotDisposeHandler } from  "epic-global/HotUtils"
import {
	makeThemeFontSize, getThemeName, getThemeCreator, setThemeCreator, getPaletteName,
	getPaletteCreator, setPaletteCreator
} from "./ThemeState"
import { AppEventType, SettingsPath } from "epic-global/Constants"



const
	log = getLogger(__filename)

let
	unsubscribe:Function


addHotDisposeHandler(module,() => {
	if (unsubscribe) {
		unsubscribe()
		unsubscribe = null
	}
})

// SUBSCRIBE FOR SETTINGS UPDATES
function subscribe() {
	if (!isStoreReady() || unsubscribe)
		return
	
	unsubscribe = getStore().observe(SettingsPath,(newSettings:ISettings) => {
		const
			{themeName,paletteName} = newSettings
		
		let
			changed = false
			
		
		if (paletteName && paletteName !== getPaletteName()) {
			log.info(`Palette changed: ${paletteName}`)
			setPaletteCreator(getPaletteCreator(paletteName))
			changed = true
		}
		
		
		if (changed || (themeName && themeName !== getThemeName())) {
			log.info(`Theme changed: ${themeName}`)
			setThemeCreator(getThemeCreator(themeName))
			changed = true
		}
		
		if (changed) {
			EventHub.emit(AppEventType.ThemeChanged,getTheme(),getPalette())
		}
	})
	
	//
}

// LISTEN FOR STORE READY
EventHub.once(AppEventType.StoreReady,subscribe)

// SEE IF IT IS READY NOW
if (isStoreReady()) {
	subscribe()
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
	let getPalette:any
	//noinspection JSUnusedLocalSymbols
	let themeFontSize:typeof makeThemeFontSize
}


acceptHot(module,log)
