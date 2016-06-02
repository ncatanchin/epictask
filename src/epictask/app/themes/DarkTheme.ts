import * as Styles from 'material-ui/styles'
//import * as _ from 'lodash'

/**
 * Get colors ref
 */
const {colors:c} = Styles
const baseTheme = _.cloneDeep(Styles.darkBaseTheme)

const navBarHeight = 50
const windowControlDim = navBarHeight / 5


const {
	textColor,
	canvasColor,
	primary1Color,
	primary1ColorText,
	primary2Color,
	primary3Color,
	accent1Color,
	accent1ColorText,
	accent2Color,
	accent2ColorText,
	alternateBgColor,
	alternateTextColor
} = require('./Palettes').dark


export const DarkTheme = Styles.getMuiTheme(_.merge(baseTheme, {
	name: 'DarkTheme',

	/**
	 * Global
	 */

	fontFamily: 'Roboto,sans-serif',
	fontWeight: 400,
	
	navBar: {
		logoStyle: {
			height: navBarHeight
		},
		controlStyle: {
			color: 'white',
			height: windowControlDim,
			width: windowControlDim,
			fontSize: windowControlDim * 0.7,
			borderRadius: windowControlDim / 2,
			borderColor: 'rgba(255,255,255,0.2)',
			margin: '0.2rem'
		},
		style: {
			color: primary1ColorText,
			height: navBarHeight,
			backgroundColor: primary1Color
		}
	},

	/**
	 * Search Panel
	 */
	searchPanel: {
		wrapperStyle: {
			backgroundColor: primary2Color,
		},
		hintStyle: {
			backgroundColor: 'transparent',
			color: textColor,
			fontWeight: 100
		},
		style: {
			backgroundColor: 'transparent',
			color: alternateTextColor
		}
	},

	
	palette: {
		primary1Color,
		primary2Color,
		primary3Color,
		accent1Color,
		accent2Color,
		canvasColor,
		textColor,
		alternateTextColor
	}
}))