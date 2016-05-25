import * as Styles from 'material-ui/styles'
import * as _ from 'lodash'

/**
 * Get colors ref
 */
const {colors} = Styles

/**
 * Get required colors locally
 */
const {
	purple300,
	purple500,
	purple700,
	blueGrey800
} = colors

/**
 * Define our dark palette
 */
export const DarkTheme = Styles.getMuiTheme(_.merge({},Styles.darkBaseTheme, {
	palette: {
		primary1Color: purple500,
		primary2Color: purple300,
		primary3Color: purple700,
		accent1Color: blueGrey800,
		canvasColor: blueGrey800
	}
}))


/**
 * Export the default theme for reference
 */
export const DefaultTheme = DarkTheme


// Internal ref to the current theme
let theme = DefaultTheme

/**
 * Set the current theme
 *
 * @param newTheme
 */
export function setTheme(newTheme) {
	theme = newTheme
}

export function getTheme() {
	return theme
}

/**
 * Export getTheme globally
 *
 * @global getTheme
 */
declare global {
	var getTheme:any
}


// Export globals
Object.assign(global as any,{
	getTheme
})
