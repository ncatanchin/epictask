
import './styles'
import { acceptHot } from  "epic-common"
import { makeThemeFontSize } from "./ThemeState"

export * from './ThemeState'
export * from './ThemeDecorations'

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
