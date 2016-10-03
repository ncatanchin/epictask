
import './styles'
import { acceptHot } from "shared/util/HotUtils"
import { makeThemeFontSize } from "shared/themes/ThemeState"

export * from './ThemeState'
export * from './ThemeDecorations'


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
