import * as Styles from 'material-ui/styles'

import {
	CSSHoverState,
	CSSFocusState,
	convertRem,makeTransition,Transparent, createStyles,rem, makePaddingRem } from "../styles/CommonRules"
import { colorAlpha } from "epic-styles/styles/ColorTools"


/**
 * Get colors ref
 */
const
	tc = require('tinycolor2'),
	{colors:c} = Styles,
	
	navBarHeight = 50,
	windowControlDim = navBarHeight / 5,


	
	// FONTS
	fontFamilyRegular = 'AvenirNext',
	fontFamilyDetail = 'fira-code',
	
	//const fontFamily = 'Roboto,sans-serif'
	fontFamily = fontFamilyRegular,
	fontWeight = 400,
	fontSize = 10,
	
	
	
	// STATUS BAR HEIGHT
	statusBarHeight = 2.6


//CRITICAL - WE MUST DELETE ANY STYLES WITH SIMILAR NAMES FROM MATERIAL-UI STYLE
const baseTheme = Styles.getMuiTheme(_.cloneDeep(Styles.darkBaseTheme))
delete baseTheme['textField']

function themeFontSize(multiplier:number) {
	return fontSize * multiplier
}

/**
 * Create the sheet theme
 *
 * @param accent
 * @param primary
 */
function makeSheetTheme({text,alternateText,accent,primary}) {
	return [{
		
		backgroundColor: primary.hue1,
		
		search: {
			wrapper: [makePaddingRem(0.6,1),{
				backgroundColor: Transparent,
				
			}],
			
			underline: [{
				transform: 'scaleX(1)',
				borderBottom: `0.1rem solid ${accent.hue1}`,
				//borderBottomColor: accent.hue1,
				bottom: '0px'
			}],
			
			field: [{
				height: rem(3.6),
				backgroundColor: Transparent,
				color: alternateText.primary
			}],
			
			input: [makePaddingRem(0,1),{
				fontWeight: 500,
				color: text.primary,
				backgroundColor: primary.hue3
			}],
			
			hint: [makePaddingRem(0,1),{
				marginBottom: -6,
				fontWeight: 400,
				color: primary.hue1,
				//color: text.primary,
				backgroundColor: Transparent
			}],
		}
	}]
}

/**
 * Create the compiled dark theme
 *
 * @param palette
 * @returns {any}
 */
export function DefaultTheme(palette) {
	
	
	const
		// PALETTE
		{
			primary,
			secondary,
			accent,
			warn,
			success,
			background,
			text,
			alternateText
		} = palette
	
		
	const
		focusStyle = {
			boxShadow: `0 0 0.5rem ${colorAlpha(accent.hue1, 1)}`
		}
		
	// INPUT
	const
		elementFocus = {
			//boxShadow: `0 0 0.5rem ${colorAlpha(accent.hue1, 1)}`
		},
		
		inputHighlight = makeStyle({
			//border: `${convertRem(0.1)}px solid transparent`,
			border: `${convertRem(0.1)}px solid ${accent.hue1}`,
			backgroundColor: accent.hue1,
			//boxShadow: `0 0 0.5rem ${colorAlpha(accent.hue1, 1)}`
			boxShadow: "0 0 0.4rem 0.2rem rgba(0, 145, 234,0.9) inset"
		}),
		
		invalidStyle = {
			boxShadow: `0 0 0.5rem ${colorAlpha(warn.hue1, 1)}`
		},
		
		inputInvalid = [invalidStyle,{
			focused: invalidStyle,
			hovering: invalidStyle
		}],
		
		inputBorder = {
			border: `${convertRem(0.1)}px solid ${primary.hue1}`
			
		},
		
		inputStyle = [
			makeTransition(['border','box-shadow','background-color']),inputBorder,{
				minHeight: rem(4),
				
				// FOCUS STATE
				focused: inputHighlight,
				
				// INVALID STATE
				invalid: inputInvalid
			}],
	
		selectStyle = {
			[CSSHoverState]: inputHighlight,
			[CSSFocusState]: inputHighlight,
			hovering: inputHighlight,
			focused: inputHighlight,
			
			// INVALID STATE
			invalid: inputInvalid
		}
		
		
		
	return _.merge({},baseTheme, createStyles({
		ThemeName: 'DefaultTheme',
		
		/**
		 * Global
		 */
		
		fontFamily,
		fontWeight,
		fontSize,
		
		
		textColor: text.primary,
		alternateTextColor: alternateText.primary,
		
		progressIndicatorColor: accent.hue1,// secondary.hue1,
		
		elementFocus,
		
		input: inputStyle,
		inputBorder,
		inputInvalid,
		
		select: selectStyle,
		
		search: {
			itemHeight: rem(4.8)
		},
		
		textField: {
			hintColor: text.secondary,
			backgroundColor: primary.hue3
		},
	
		jobLog: {
			levels: {
				info: {
					color: success.hue1
				},
				warn: {
					color: accent.hue1
				},
				success: {
					color: success.hue1
				},
				error: {
					color: warn.hue1
				}
			}
		},
		
		/**
		 * Job Monitor widget
		 */
		jobs: {
			
			root: {
				backgroundColor: primary.hue1,
				color: text.primary
			},
			
			list: {
				backgroundColor: primary.hue1,
				
				item: {
					selected: {
						backgroundColor: primary.hue3,
					}
				},
				
				divider: {
					borderBottomColor: primary.hue2
				}
			},
			
			item: {
				inProgress: {
					color: accent.hue1
				},
				
				success: {
					color: success.hue1
				},
				
				failed: {
					color: warn.hue1
				},
				
				label: {
					time: {
						color: text.secondary
					}
				}
			},
			
			detail: {
				
				root: {
					borderLeftColor: primary.hue2,
				},
				header: {
					backgroundColor: primary.hue3,
					color: text.secondary
				},
				
				logs: {
					backgroundColor: background,
					
					
					
					entry: {
						
						
						
					}
				}
				
			},
		},
		
		/**
		 * Style the status bar, for jobs, saving, info, etc
		 */
		// Height is needed for calculating layouts
		statusBarHeight,
		
		statusBar: {
			
			// Root Colors
			root: {
				height: statusBarHeight,
				backgroundColor: background,//primary.hue3,
				borderTopColor: primary.hue3,
				color: text.primary,
				
				
			},
			
			status: {
				item: {
					backgroundColor: primary.hue1,//background,
					':hover': {
						backgroundColor: tc(primary.hue2).lighten(5).toRgbString()
					},
				}
			},
			
			
		},
		
		/**
		 * Label Chip Styles
		 */
		labelChip: {
			text: {
				fontSize: rem(1),
				fontWeight: 500
			},
			
			accessory: {
				remove: {
					hover: {
						backgroundColor: 'white',
						color: warn.hue1
					}
				}
			}
		},
		
		/**
		 * TypeAheadSelect styling
		 */
		typeAheadSelect: {
			root: inputStyle
		},
		
		/**
		 * Sheet theme style
		 */
		sheet: makeSheetTheme(palette),
		
		/**
		 * Issue state icon
		 */
		issueStateIcon: {
			
		},
		
		app: {
			fontFamily,
			fontWeight,
			background: background
		},
		
		
		/**
		 * Chips field
		 */
		chipsField: {
			chipContent: {
				control: {
					':hover': {
						color: warn.hue1
					}
				}
			}
		},
		
		/**
		 * Avatar
		 */
		avatar: {
			
		},
		
		button: {
			
		},
		
		
		/**
		 * This styling is for material-ui Lists
		 */
		list: {
			paddingTop: 0,
			paddingBottom: 0
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
					color: tc(primary.hue4).lighten(20).toString(),
					backgroundColor: 'transparent',
					fontWeight: 400
				},
				
			}
			
		},
		
		/**
		 * Dialog
		 */
		dialog: {
			
			menu: {
				color: text.primary,
				fill: text.secondary,
				backgroundColor: Transparent,//primary.hue2 //primary.hue2//,text.primary
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
				//backgroundColor: primary.hue2,
				backgroundColor: Transparent,
				
				hint: {
					zIndex: 5,
					textTransform: 'uppercase',
					color: primary.hue4,
					backgroundColor: 'transparent'
				},
				
				
				floatingLabel: {
					color: primary.hue4,
					backgroundColor: 'transparent'
				},
				
				floatingLabelFocus: {
					color: text.secondary,
					backgroundColor: 'transparent'
				},
				
				underlineDisabled: {
					borderBottomWidth: `0.1rem`,
					transform: 'scaleX(1)'
				},
				
				underlineFocus: {
					borderBottomWidth: `0.1rem`
				}
				
				
			},
		},
		
		issueEditDialog: {},
		issueCreateInline: {},
		
		issueActivityText: {
			activityContent: {
				eventGroup: {
					
				}
			}
		},
		
		repoAddDialog: {
			container: {
				// boxShadow: `0 0 1rem ${accent.hue1}`,
				boxShadow: `0 0 1rem ${text.primary}`,
				minHeight: 50
			}
		},
		
		header: {
			logo: {},
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
				backgroundColor: background,
				height: navBarHeight
				
			}
		},
		
		ideRoot: {
			
		},
		
		/**
		 * Tool Panel Container
		 */
		toolPanel: {
			
			[ToolPanelLocation.Left]: { minDim: 2 },
			[ToolPanelLocation.Right]: { minDim: 2 },
			[ToolPanelLocation.Bottom]: { minDim: 2.4 },
			[ToolPanelLocation.Popup]: { minDim: 2.4 },
			
			gutter: {
				backgroundColor: tc(primary.hue2).lighten(5).toRgbString(),
			},
			
			
			tool: {
				header: {
					color: text.primary,
					backgroundColor: primary.hue2,
					borderColor: primary.hue3,
					
					label: {
						color: text.secondary,
					}
				},
				
				container: {
					borderColor: colorAlpha(primary.hue2,0.9)
				}
			},
			
			tools: {
				// borderColor: primary.hue3
				[ToolPanelLocation.Left]: { borderLeftColor: colorAlpha(primary.hue3,0.9) },
				[ToolPanelLocation.Right]: { borderRightColor: colorAlpha(primary.hue3,0.9)},
				[ToolPanelLocation.Bottom]: { borderBottomColor: colorAlpha(primary.hue3,1) },
				[ToolPanelLocation.Popup]: { borderTopColor: colorAlpha(primary.hue3,0.9) },
				
			}
		},
		
		/**
		 * RepoPanelTool
		 */
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
				color: text.secondary,
				':hover': {
					backgroundColor: accent.hue1
				}
			},
			
			list: {
				item: {
					backgroundColor: primary.hue3,
					opacity: 0.6,
					
					hover: {
						backgroundColor: accent.hue2,
						color: text.primary,
						opacity: 1
					},
					
					enabled: {
						//borderColor: accent.hue1,
						color: text.primary,
						opacity: 1
					},
					
					selected: {
						backgroundColor: accent.hue1,
						color: text.primary,
						opacity: 1,
						
						hover: {
							backgroundColor: accent.hue2,
							color: text.primary,
							opacity: 1
						}
					}
					
				}
				
				
			}
		},
		
		/**
		 * Search Panel
		 */
		searchField: {
			
			
			wrapper: {},
			
		},
		
		/**
		 * Search Issues Panel
		 */
		issuesPanelSearch: {
			
			// EMBEDDED SearchField -> input
			input: {
				backgroundColor: primary.hue2,
				
				':focus': {
					backgroundColor: primary.hue1
				}
			}
		},
		
		/**
		 * Search Results
		 */
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
				label: {},
				action: {},
				type: {
					//backgroundColor: accent.hue3,
					//color: text.primary
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
		
		issueGroupHeader: {
			
			expanded: {
				boxShadow: 'inset 0.1rem 0.1rem 0.3rem ' + tc(primary.hue2).setAlpha(0.3).toRgbString(),
				backgroundColor: tc(primary.hue2).lighten(10).toRgbString()
			}
		},
		
		/**
		 * Issues Panel
		 */
		issuesPanel: {
			
			
			panel: {
				backgroundColor: tc(primary.hue2).darken(5).toRgbString()
			},
			
			
			
			
			
		},
		
		/**
		 * Issue item styling
		 */
		issueItem: {
			
			
			
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
				backgroundColor: primary.hue3,
				color: text.primary,
				
				row1: {
					repo: {
						
					}
				}
			},
			
			content: {
				backgroundColor: background,//primary.hue2, //secondary.hue1,
				color: text.primary,
				
				activities: {
					activity: {
						
					}
				}
			},
			
			footer: {
				backgroundColor: accent.hue1,
				color: text.primary
			},
			
		},
		/**
		 * Toast
		 */
		
		toast: {
			bgInfo: {
				backgroundColor: accent.hue1
			},
			fgInfo: {
				color: text.primary
			},
			bgSuccess: {
				backgroundColor: success.hue1
			},
			fgSuccess: {
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
			
			content: {
				backgroundColor: primary.hue2
			},
			
			action: {
				
				
				info: {
					backgroundColor: secondary.hue1,
					color: text.primary,
					':hover': {
						backgroundColor: secondary.hue2
					}
				},
				
				success: {
					backgroundColor: secondary.hue1,
					color: success.hue1,
					':hover': {
						color: secondary.hue2,
						backgroundColor: success.hue1
					}
				},
				
				error: {
					backgroundColor: primary.hue1,
					color: text.secondary,
					':hover': {
						color: text.primary,
						backgroundColor: warn.hue1
					}
				}
			},
			
			
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
			errorColor: warn.hue1,
			secondary,
			primary,
			accent,
			background
		}
	}))
}

export namespace DefaultTheme {
	export const ThemeName = 'DefaultTheme'
}
export default DefaultTheme