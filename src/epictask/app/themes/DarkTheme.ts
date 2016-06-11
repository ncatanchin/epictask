import * as Styles from 'material-ui/styles'
import {makeTheme,Palettes} from './material/MaterialTools'
//import * as _ from 'lodash'

/**
 * Get colors ref
 */
const {colors:c} = Styles
const baseTheme = _.cloneDeep(Styles.darkBaseTheme)

const navBarHeight = 50
const windowControlDim = navBarHeight / 5


const theme = makeTheme(
	Palettes.grey,
	['l900','#303030','l800','l700'],
	Palettes.purple,
	['l400','l200','l100','l50'],
	Palettes.teal,
	['l400','l200','l100','l50'],
	Palettes.deepOrange,
	['l400','l200','l100','l50'],
	Palettes.black,
	true
)

const {primary,secondary,accent,warn,background,text,alternateText} = theme

const fontFamilyRegular = 'AvenirNext'
const fontFamilyDetail = 'fira-code'

//const fontFamily = 'Roboto,sans-serif'
const fontFamily = fontFamilyRegular
const fontWeight = 400
const fontSize = 10

export const DarkTheme = Styles.getMuiTheme(_.merge(baseTheme, {
	name: 'DarkTheme',

	/**
	 * Global
	 */

	fontFamily,
	fontWeight,
	fontSize,

	textColor: text.primary,

	app: {
		fontFamily,
		fontWeight
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
			color: text.primary,
			backgroundColor: background,//primary.hue1,
			height: navBarHeight

		}
	},


	repoPanel: {
		root: {
			backgroundColor: primary.hue1,
			color: text.primary
		},
		header: {
			backgroundColor: primary.hue2,
			color: text.secondary
			// padding: '1rem 1rem'
		},
		headerButton: {
			backgroundColor: primary.hue2,
			color: text.secondary
		},
		headerButtonHover: {
			backgroundColor: accent.hue1,
		},
		list: {
			item: {
				backgroundColor: primary.hue3,
				opacity: 0.6
			},

			itemHover: {
				backgroundColor: accent.hue2,
				color: text.primary,
				opacity: 1
			},

			itemEnabled: {
				backgroundColor: secondary.hue1,
				color: text.primary,
				opacity: 1
			},

			itemSelected: {
				backgroundColor: accent.hue1,
				color: text.primary,
				opacity: 1
			},
			itemSelectedHover: {
				backgroundColor: accent.hue2,
				color: text.primary,
				opacity: 1
			}


		}
	},

	/**
	 * Search Panel
	 */
	searchPanel: {
		wrapperStyle: {
			backgroundColor: primary.hue2,
		},

		wrapperExpandedStyle: {

		},

		hintStyle: {
			backgroundColor: 'transparent',
			color: text.secondary,
			fontWeight: 100
		},

		style: {
			backgroundColor: 'transparent',
			color: text.secondary
		},

		focusedStyle: {
			backgroundColor: primary.hue4,
			color: text.primary
		}
	},

	searchResults: {
		result: {
			normal: {
				backgroundColor: text.primary,
				color: primary.hue1
			},
			selected: {
				backgroundColor: accent.hue1,
				color: text.primary
			}
		},

		content: {
			label: {

			},
			action: {

			},
			type: {
				backgroundColor: accent.hue3,
				color: text.primary
			},
			selected: {

			}

		}
	},

	/**
	 * Issues Panel
	 */
	issuesPanel: {
		avatar: {
			borderColor: secondary.hue1,
		},

		panel: {
			backgroundColor: primary.hue2
		},

		issue: {
			backgroundColor: primary.hue1,
			color: text.primary
		},

		issueSelected: {
			backgroundColor: accent.hue1,

		},

		issueSelectedMulti: {
			backgroundColor: accent.hue1,
			color: text.primary
		},

		issueMilestone: {
			color: text.secondary
		},

		issueRepo: {
			color: secondary.hue1,
			fontFamily: fontFamilyRegular,
			fontWeight: 500
		},

		issueTitleRow: {
			fontFamily: fontFamilyRegular,
		},

		issueTitle: {
			color: text.hintOrDisabledOrIcon,
			fontFamily: fontFamilyRegular,
			fontWeight: 500
		},

		issueTitleSelected: {
			color: text.primary,
			fontWeight: 500
		},

		issueLabel: {
			// fontFamily: fontFamilyDetail
		},

		issueTitleSelectedMulti: {

		}
	},

	/**
	 * Issue detail
	 */
	issueDetail: {
		root: {
			color: text.primary
		}
	},
	/**
	 * Toast
	 */

	toast: {
		bgInfo: {
			backgroundColor: secondary.hue1
        },
		fgInfo: {
			color: text.primary
		},
		bgError: {
			backgroundColor: warn.hue1
		},
		fgError: {
			color: text.primary
		},

		root: {
			fontFamily: fontFamily,

		},

		body: {
			fontFamily: fontFamily
		},

		toast: {
			fontFamily: fontFamily
		},

		toastContent: {
			height: 48
		},

		action: {
			height: 48,
		},

		actionInfo: {
			backgroundColor: secondary.hue1,
			color: text.primary,
			':hover': {
				backgroundColor: secondary.hue2
			}
		},

		actionError: {
			backgroundColor: warn.hue1,
			color: text.primary,
			':hover': {
				backgroundColor: warn.hue2
			}
		}
	},

	palette: {
		text,
		alternateText,
		textColor: text.primary,
		canvasColor: background,
		primary1Color: primary.hue1,
		primary1ColorText: text.primary,
		primary2Color: primary.hue2,
		primary2ColorText: text.primary,
		primary3Color: primary.hue3,
		primary3ColorText: text.primary,

		accent1Color: accent.hue1,
		accent1ColorText: text.primary,
		accent2Color: accent.hue2,
		accent2ColorText: text.primary,
		accent3Color: accent.hue3,
		accent3ColorText: text.primary,
		highlightColor: accent.hue1,
		errorColor: warn.hue1
	}
}))
