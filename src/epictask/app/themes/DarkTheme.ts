import * as Styles from 'material-ui/styles'
//import * as _ from 'lodash'

/**
 * Get colors ref
 */
const {colors:c} = Styles
const baseTheme = _.cloneDeep(Styles.darkBaseTheme)

const navBarHeight = 50
const windowControlDim = navBarHeight / 5

const palette = require('./Palettes').dark

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
	accent3Color,
	accent3ColorText,
	accent4Color,
	accent4ColorText,
	highlightColor,
	highlightColorText,
	alternateBgColor,
	alternateTextColor,
	errorColor
} = palette


export const DarkTheme = Styles.getMuiTheme(_.merge(baseTheme, {
	name: 'DarkTheme',

	/**
	 * Global
	 */

	fontFamily: 'Roboto,sans-serif',
	fontWeight: 400,

	snackbar: {
		root: {
			height: 48
		}
	},

	header: {
		logoStyle: {
			height: navBarHeight
		},
		controlStyle: {
			color: 'white',
			height: windowControlDim,
			width: windowControlDim,
			fontSize: windowControlDim * 0.7,
			backgroundColor: 'white',
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


	repoPanel: {
		headerStyle: {
			backgroundColor: accent3Color,
			// padding: '1rem 1rem'
		},
		list: {
			item: {
				backgroundColor: accent1Color,
				opacity: 0.6
			},

			itemHover: {
				backgroundColor: accent4Color,
				opacity: 1
			},

			itemEnabled: {
				backgroundColor: accent4Color,
				opacity: 0.7
			},

			itemSelected: {
				backgroundColor: highlightColor,
				color: highlightColorText,
				opacity: 0.8
			},
			itemSelectedHover: {
				backgroundColor: highlightColor,
				color: highlightColorText,
				opacity: 1
			}


		}
	},

	/**
	 * Search Panel
	 */
	searchPanel: {
		wrapperStyle: {
			backgroundColor: primary2Color,
		},

		wrapperExpandedStyle: {

		},

		hintStyle: {
			backgroundColor: 'transparent',
			color: textColor,
			fontWeight: 100
		},

		style: {
			backgroundColor: 'transparent',
			color: alternateTextColor
		},
		focusedStyle: {
			backgroundColor: alternateBgColor,
			color: primary3Color
		}
	},

	searchResults: {
		result: {
			normal: {
				backgroundColor: textColor,
				color: canvasColor
			},
			selected: {
				backgroundColor: highlightColor,
				color: highlightColorText
			}
		},

		content: {
			label: {

			},
			action: {

			},
			type: {
				backgroundColor: accent2Color,
				color: accent2ColorText
			},
			selected: {

			}

		}
	},


	palette
}))
