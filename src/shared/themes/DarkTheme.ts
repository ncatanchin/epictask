import * as Styles from 'material-ui/styles'
import {makeTheme, Palettes} from './material/MaterialTools'

//import * as _ from 'lodash'

const tinycolor = require('tinycolor2')
/**
 * Get colors ref
 */
const {colors:c} = Styles
const baseTheme = _.cloneDeep(Styles.darkBaseTheme)

const navBarHeight = 50
const windowControlDim = navBarHeight / 5


const theme = makeTheme(
	Palettes.grey,
	['l900', '#303030', 'l800', 'l700'],
	Palettes.purple,
	['l400', 'l300', 'l200', 'l100'],
	Palettes.teal,
	['l400', 'l200', 'l100', 'l50'],
	Palettes.red,
	['l400', 'l200', 'l100', 'l50'],
	Palettes.black,
	true
)

const {primary, secondary, accent, warn, background, text, alternateText} = theme

const fontFamilyRegular = 'AvenirNext'
const fontFamilyDetail = 'fira-code'

//const fontFamily = 'Roboto,sans-serif'
const fontFamily = fontFamilyRegular
const fontWeight = 400
const fontSize = 10

const InputStyle = {
	color: text.primary,
	backgroundColor: primary.hue2,

	hint: {
		zIndex: 5,
		textTransform: 'uppercase',
		color: primary.hue4,
		backgroundColor: 'transparent'
	}
}



export const DarkTheme = Styles.getMuiTheme(_.merge(baseTheme, createStyles({
	name: 'DarkTheme',

	/**
	 * Global
	 */

	fontFamily,
	fontWeight,
	fontSize,

	textColor: text.primary,
	alternateTextColor: alternateText.primary,

	progressIndicatorColor: secondary.hue1,


	/**
	 * TypeAheadSelect styling
	 */
	TypeAheadSelect: [InputStyle,{

	}],


	issueStateIcon: {
		open: {
			backgroundColor: 'rgba(101,181,73,1)',
			color: text.primary
			// color: 'rgba(101,181,73,1)',
			// backgroundColor: 'transparent'
		},
		closed: {
			color: text.primary,
			backgroundColor: warn.hue1
		}
	},

	app: {
		fontFamily,
		fontWeight
	},

	chipsField: {
		chipContent: {
			control: {
				':hover': {
					color: warn.hue1
				}
			}
		}
	},

	avatar: {
		root:   {},
		avatar: {
			borderColor: secondary.hue1,
			backgroundColor: accent.hue1
		}
	},

	button: {
		root: {
			fontFamily: fontFamilyRegular,
			fontWeight: 500,
			borderRadius: 2
		},
		flat: {
			backgroundColor: primary.hue1,
			color:           text.secondary,
		},

		raised: {
			color:           text.primary,
			backgroundColor: secondary.hue1
		},

		disabled: {
			color:           text.hintOrDisabledOrIcon,
			backgroundColor: primary.hue1
		}
	},

	form: {
		menuItem: [{
			cursor: 'pointer'
		}],
		select: {

			list: {
				padding: 0,
				paddingTop: 0,
				paddingBottom: 0,
				backgroundColor: 'transparent'
			},
			item: [{
				cursor: 'pointer'
			}]
		}
	},

	/**
	 * This styling is for material-ui Lists
	 */
	list: {
		paddingTop:0,
		paddingBottom:0
	},

	/**
	 * Inline editing
	 */
	inline: {
		input: {
			color: text.primary,
			backgroundColor: primary.hue3,
			focused: {
				backgroundColor: secondary.hue1,
			},

			hint: {
				//color: accent.hue2,
				color: tinycolor(primary.hue4).lighten(20).toString(),
				backgroundColor: 'transparent',//text.primary,
				//fontStyle: 'italic',
				fontWeight: 400
			},

		}

	},

	dialog: {
		titleFontSize: fontSize * 2,
		bodyFontSize:  fontSize * 1.5,
		bodyColor:     text.primary,

		root: {

		},

		actions: {
			backgroundColor:           primary.hue1,
			color: text.primary
		},
		action: {
			titleFontSize: fontSize * 1.3,
			padding: '1rem 2rem',
			margin: '0 0 0 1rem'
		},

		body: {
			backgroundColor:           primary.hue1,
			color: text.primary
		},

		title: {
			color:           text.primary,
			backgroundColor: secondary.hue1,

			label: {
				textTransform: 'uppercase'
			},

			avatar: {
				avatar: {
					borderColor: accent.hue1
				}
			}
		},

		menu: {
			color: text.primary,
			fill: text.secondary,
			backgroundColor: primary.hue2 //primary.hue2//,text.primary
		},

		menuItem: {
			backgroundColor: primary.hue2,
			color: text.primary,
			hover: {
				color: text.primary + ' !important',
				backgroundColor: accent.hue1 + ' !important'
			}

		},

		input: {
			color: text.primary,
			backgroundColor: primary.hue2,

			hint:  {
				zIndex: 5,
				textTransform: 'uppercase',
				color:           primary.hue4,
				backgroundColor: 'transparent',//text.primary,
				// fontStyle:   'italic',
				// fontWeight: 100

			},


			floatingLabel: {
				color:           primary.hue4,
				backgroundColor: 'transparent',//backgroundColor: text.secondary
			},

			floatingLabelFocus: {
				color:           text.secondary,
				backgroundColor: 'transparent',//backgroundColor: text.secondary
			},
			underlineDisabled: {
				borderColor: 'transparent',
				borderBottomWidth: `0.1rem`,
				transform: 'scaleX(1)'
			},
			underlineFocus: {
				borderColor: primary.hue3,
				borderBottomWidth: `0.1rem`
			}


		},


	},

	// dialog: {
	// 	titleFontSize: fontSize * 2,
	// 	bodyFontSize:  fontSize * 1.5,
	// 	bodyColor:     text.primary,
	//
	// 	root: {
	//
	// 	},
	//
	// 	actions: {
	// 		color:           primary.hue1,
	// 		backgroundColor: text.primary
	// 	},
	// 	action: {
	// 		titleFontSize: fontSize * 1.3,
	// 		padding: '1rem 2rem',
	// 		margin: '0 0 0 1rem'
	// 	},
	//
	// 	body: {
	// 		color:           primary.hue1,
	// 		backgroundColor: text.primary
	// 	},
	//
	// 	title: {
	// 		color:           text.primary,
	// 		backgroundColor: secondary.hue1,
	//
	// 		label: {
	// 			textTransform: 'uppercase'
	// 		},
	//
	// 		avatar: {
	// 			avatar: {
	// 				borderColor: accent.hue1
	// 			}
	// 		}
	// 	},
	//
	// 	menu: {
	// 		color: primary.hue1,
	// 		fill: primary.hue3,
	// 		backgroundColor: 'transparent'//,text.primary
	// 	},
	//
	// 	menuItem: {
	// 		color: primary.hue1,
	// 		backgroundColor: text.primary,
	// 		hover: {
	// 			color: text.primary + ' !important',
	// 			backgroundColor: accent.hue1 + ' !important'
	// 		}
	//
	// 	},
	//
	// 	input: {
	// 		color: primary.hue1,
	//
	// 		hint:  {
	// 			color:           secondary.hue3,
	// 			backgroundColor: 'transparent',//text.primary,
	// 			fontStyle:   'italic',
	// 			fontWeight: 100
	//
	// 		},
	//
	//
	// 		floatingLabel: {
	// 			color:           primary.hue3,
	// 			backgroundColor: 'transparent',//backgroundColor: text.secondary
	// 		},
	//
	// 		floatingLabelFocus: {
	// 			color:           secondary.hue2,
	// 			backgroundColor: 'transparent',//backgroundColor: text.secondary
	// 		},
	// 		underlineDisabled: {
	// 			borderColor: secondary.hue3,
	// 			borderBottomWidth: `0.1rem`,
	// 			transform: 'scaleX(1)'
	// 		},
	// 		underlineFocus: {
	// 			borderColor: secondary.hue2,
	// 			borderBottomWidth: `0.1rem`
	// 		}
	//
	//
	// 	},
	//
	//
	// },

	issueEditDialog: {

	},
	issueCreateInline: {

	},

	repoAddDialog: {
		container: {
			// boxShadow: `0 0 1rem ${accent.hue1}`,
			boxShadow: `0 0 1rem ${text.primary}`,
			minHeight: 50
		}
	},

	header: {
		logoWrapper:    {
			height: navBarHeight
		},
		logo:    {

		},
		controlStyle: {
			color:           'white',
			height:          windowControlDim,
			width:           windowControlDim,
			fontSize:        windowControlDim * 0.7,
			backgroundColor: 'white',
			borderRadius:    windowControlDim / 2,
			borderColor:     'rgba(255,255,255,0.2)',
			margin:          '0.2rem'
		},
		style:        {
			color:           text.primary,
			backgroundColor: background,//primary.hue1,
			height:          navBarHeight

		}
	},


	repoPanel: {
		root: {
			backgroundColor: primary.hue1,
			color:           text.primary
		},


		header:            {
			backgroundColor: primary.hue2,
			color:           text.secondary
			// padding: '1rem 1rem'
		},
		headerButton:      {
			backgroundColor: primary.hue2,
			color:           text.secondary
		},
		headerButtonHover: {
			backgroundColor: accent.hue1,
		},
		list:              {
			item: {
				backgroundColor: primary.hue3,
				opacity:         0.6
			},

			itemHover: {
				backgroundColor: accent.hue2,
				color:           text.primary,
				opacity:         1
			},

			itemEnabled: {
				backgroundColor: secondary.hue1,
				color:           text.primary,
				opacity:         1
			},

			itemSelected:      {
				backgroundColor: accent.hue1,
				color:           text.primary,
				opacity:         1
			},
			itemSelectedHover: {
				backgroundColor: accent.hue2,
				color:           text.primary,
				opacity:         1
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

		wrapperExpandedStyle: {},

		hintStyle: {
			backgroundColor: 'transparent',
			color:           text.secondary,
			fontWeight:      100
		},

		style: {
			backgroundColor: 'transparent',
			color:           text.secondary
		},

		focusedStyle: {
			backgroundColor: primary.hue4,
			color:           text.primary
		}
	},

	searchResults: {
		result: {
			normal:   {
				backgroundColor: text.primary,
				color:           primary.hue1
			},
			selected: {
				backgroundColor: accent.hue1,
				color:           text.primary
			}
		},

		content: {
			label:    {},
			action:   {},
			type:     {
				backgroundColor: accent.hue3,
				color:           text.primary
			},
			selected: {}

		}
	},


	/**
	 * Issue filters
	 */
	issueFilters: {
		root: {
			color: text.secondary
		},

		filters: {
			controls: {
				groupBy: {
					color: text.primary,
					backgroundColor: accent.hue1
				}
			}
		},

		hasFiltersColor: accent.hue1

	},


	/**
	 * Issues Panel
	 */
	issuesPanel: {


		panel: {
			backgroundColor: primary.hue2
		},


		issueGroupHeader: {
			color: text.primary,
			backgroundColor: secondary.hue1
		},



		issue: {
			backgroundColor: primary.hue1,
			color:           text.primary,

			selected: {
				backgroundColor: accent.hue1,

			}
		},



		issueSelectedMulti: {
			backgroundColor: accent.hue1,
			color:           text.primary
		},

		issueMilestone: {
			color: text.secondary
		},

		issueNumber: {
			color:      text.primary
		},

		issueRepo: {
			color:      secondary.hue1,
			fontFamily: fontFamilyRegular,
			fontWeight: 500
		},

		issueTitleRow: {
			fontFamily: fontFamilyRegular,
		},

		issueTitle: {
			color:      text.hintOrDisabledOrIcon,
			fontFamily: fontFamilyRegular,
			fontWeight: 500
		},

		issueTitleSelected: {
			color:      text.primary,
			fontWeight: 500
		},

		issueLabel: {
			// fontFamily: fontFamilyDetail
		},

		issueTitleSelectedMulti: {}
	},

	/**
	 * Issue detail
	 */
	issueDetail: {
		root: {
			color: text.primary
		},

		header: {
			//backgroundColor: accent.hue1,
			backgroundColor: tinycolor(primary.hue2).setAlpha(0.5),
			color:           text.primary,

			row1: {
				repo: {
					color: accent.hue2
				}
			}
		},

		content: {
			backgroundColor: primary.hue1, //secondary.hue1,
			color:           text.primary,

			activities: {
				activity: {


					post: {
						backgroundColor: primary.hue2,
						borderColor:     tinycolor(accent.hue1),

						user: {
							backgroundColor: accent.hue1,
							borderColor:     primary.hue1,
						},

						details: {
							backgroundColor: accent.hue1,
							color:           text.primary
						}
					},

					comment: {
						backgroundColor: primary.hue2,
						borderColor:     tinycolor(secondary.hue1),

						user: {
							backgroundColor: secondary.hue1,
							borderColor:     primary.hue1,
						},

						details: {
							backgroundColor: secondary.hue1,
							color:           text.primary
						}
					}
				}
			}
		},

		footer: {
			backgroundColor: accent.hue1,
			color:           text.primary
		},

	},
	/**
	 * Toast
	 */

	toast:       {
		bgInfo:  {
			backgroundColor: secondary.hue1
		},
		fgInfo:  {
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
			color:           text.primary,
			':hover':        {
				backgroundColor: secondary.hue2
			}
		},

		actionError: {
			backgroundColor: warn.hue1,
			color:           text.primary,
			':hover':        {
				backgroundColor: warn.hue2
			}
		}
	},

	palette: {
		                   text,
		                   alternateText,
		textColor:         text.primary,
		canvasColor:       background,
		primary1Color:     primary.hue1,
		primary1ColorText: text.primary,
		primary2Color:     primary.hue2,
		primary2ColorText: text.primary,
		primary3Color:     primary.hue3,
		primary3ColorText: text.primary,

		accent1Color:     accent.hue1,
		accent1ColorText: text.primary,
		accent2Color:     accent.hue2,
		accent2ColorText: text.primary,
		accent3Color:     accent.hue3,
		accent3ColorText: text.primary,
		highlightColor:   accent.hue1,
		errorColor:       warn.hue1
	}
})))
