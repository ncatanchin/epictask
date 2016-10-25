
import './styles'
import { acceptHot } from  "epic-global"
import { makeThemeFontSize } from "./ThemeState"

const
	log = getLogger(__filename)

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
