import * as Styles from 'material-ui/styles'

import {ToolPanelLocation} from "shared/tools/ToolTypes"
import { Transparent, createStyles,rem, makePaddingRem } from "shared/themes/styles"



/**
 * Get colors ref
 */
const
	tc = require('tinycolor2'),
	{colors:c} = Styles,
	baseTheme = _.cloneDeep(Styles.darkBaseTheme),
	
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

function themeFontSize(multiplier:number) {
	return fontSize * multiplier
}

/**
 * Create the sheet theme
 *
 * @param accent
 * @param primary
 */
function makeSheetTheme({accent,primary}) {
	return {
		search: {
			panel: [{
				backgroundColor: Transparent
			}],
			
			underline: [{
				transform: 'scaleX(1)',
				borderBottom: `0.1rem solid ${accent.hue1}`,
				borderBottomColor: accent.hue1,
				bottom: '0px'
			}],
			
			field: [{
				height: rem(3.6),
				backgroundColor: Transparent,
				color: primary.hue1
			}],
			
			input: [makePaddingRem(0,1),{
				fontWeight: 500,
				color: primary.hue1,
				backgroundColor: Transparent
			}],
			
			hint: [makePaddingRem(0,1),{
				marginBottom: -6,
				fontWeight: 400,
				color: primary.hue1,
				//color: text.primary,
				backgroundColor: Transparent
			}],
		}
	}
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
		} = palette,
	
		// INPUT
		InputStyle = {
			color: text.primary,
			backgroundColor: Transparent,
			
			hint: {
				zIndex: 5,
				textTransform: 'uppercase',
				color: primary.hue4,
				backgroundColor: 'transparent'
			}
		}
		
	return Styles.getMuiTheme(_.merge(baseTheme, createStyles({
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
					},
					
					entry: {
						':hover': {
							backgroundColor: primary.hue1,
						},
						
						time: {
							color: text.secondary
						},
						
						divider: {
							borderBottomColor: primary.hue1
						}
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
				fontSize: themeFontSize(1),
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
			root: InputStyle
		},
		
		/**
		 * Sheet theme style
		 */
		sheet: makeSheetTheme(palette),
		
		/**
		 * Issue state icon
		 */
		issueStateIcon: {
			open: {
				backgroundColor: 'rgba(101,181,73,1)',
				color: text.primary
			},
			closed: {
				color: text.primary,
				backgroundColor: warn.hue1
			}
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
			root: {
				clickable: {
					':hover': {
						backgroundColor: accent.hue1
					}
				}
			},
			avatar: {
				borderColor: secondary.hue1,
				backgroundColor: accent.hue1
			}
		},
		
		button: {
			
		},
		
		/**
		 * Form
		 */
		form: {
			menuItem: [ {
				cursor: 'pointer'
			} ],
			select: {
				
				list: {
					padding: 0,
					paddingTop: 0,
					paddingBottom: 0,
					backgroundColor: 'transparent'
				},
				item: [ {
					cursor: 'pointer'
				} ]
			}
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
					borderColor: primary.hue2,//'transparent',
					borderBottomWidth: `0.1rem`,
					transform: 'scaleX(1)'
				},
				
				underlineFocus: {
					borderColor: primary.hue3,
					borderBottomWidth: `0.1rem`
				}
				
				
			},
		},
		
		issueEditDialog: {},
		issueCreateInline: {},
		
		issueActivityText: {
			activityContent: {
				eventGroup: {
					verticalDots: {
						borderRightColor: primary.hue3
					},
					horizontalDots: {
						borderBottomColor: primary.hue3
					},
					icon: {
						backgroundColor: tc(primary.hue3).setAlpha(1).toRgbString()
					}
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
		
		homePage: {
			viewWrapper: {
				borderColor: tc(primary.hue2).setAlpha(0.9).toRgbString()
			}
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
					//borderColor: primary.hue3,
					
					label: {
						color: text.secondary,
					}
				},
				
				container: {
					
					borderColor: tc(primary.hue2).setAlpha(0.9).toRgbString()
					
				}
			},
			
			tools: {
				// borderColor: primary.hue3
				[ToolPanelLocation.Left]: { borderLeftColor: tc(primary.hue3).setAlpha(0.9).toRgbString() },
				[ToolPanelLocation.Right]: { borderRightColor: tc(primary.hue3).setAlpha(0.9).toRgbString() },
				[ToolPanelLocation.Bottom]: { borderBottomColor: tc(primary.hue3).setAlpha(1).toRgbString() },
				[ToolPanelLocation.Popup]: { borderTopColor: tc(primary.hue3).setAlpha(0.9).toRgbString() },
				
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
						borderColor: accent.hue1,
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
		searchPanel: {
			
			
			wrapper: {
				
				expanded: {
					
				}
			},
			
			hint: {
				backgroundColor: 'transparent',
				color: text.secondary,
				fontWeight: 400
			},
			
			
			
			
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
		
		
		/**
		 * Issues Panel
		 */
		issuesPanel: {
			
			
			panel: {
				backgroundColor: tc(primary.hue2).darken(5).toRgbString()
			},
			
			
			issueGroupHeader: {
				color: text.primary,
				boxShadow: 'inset 0.1rem 0.1rem 0.3rem ' + tc(primary.hue2).setAlpha(0.3).toRgbString(),
				backgroundColor: tc(primary.hue2).lighten(10).setAlpha(0.6).toRgbString(),
				
				expanded: {
					boxShadow: 'inset 0.1rem 0.1rem 0.3rem ' + tc(primary.hue2).setAlpha(0.3).toRgbString(),
					backgroundColor: tc(primary.hue2).lighten(10).toRgbString()
				}
			},
			
			
		},
		
		/**
		 * Issue item styling
		 */
		issueItem: {
			
			selected: [{
				backgroundColor: secondary.hue1,//colorAlpha(secondary.hue1,0.5),
				color: alternateText.primary,
				bar: [{
					backgroundColor: Transparent
					//backgroundColor: secondary.hue2
				}]
			}],
			
			focused: [{
				backgroundColor: accent.hue1,
				color: alternateText.primary,
				bar: [{
					backgroundColor: Transparent
					//backgroundColor: accent.hue2
				}]
			}],
			
			
			number: [{
				selected:[{
					color: alternateText.primary,
				}],
				focused:[{
					color: alternateText.primary,
				}]
			}],
			
			repo:[{
				selected:[{
					color: alternateText.primary,
				}],
				focused:[{
					color: alternateText.primary,
				}]
			}],
			
			title: [{
				selected:[{
					color: alternateText.primary,
				}],
				focused:[{
					color: alternateText.primary,
				}],
			}]
			
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
				backgroundColor: tc(primary.hue2).setAlpha(0.5).toRgbString(),
				color: text.primary,
				
				row1: {
					repo: {
						
					}
				}
			},
			
			content: {
				backgroundColor: primary.hue1, //secondary.hue1,
				color: text.primary,
				
				activities: {
					activity: {
						
						all: {
							details: {
								control: {
									button: {
										backgroundColor: 'transparent',
										color: tc(text.primary).setAlpha(0.8).toRgbString(),
										':hover': {
											color: tc(text.primary).setAlpha(1).toRgbString(),
										}
									},
									
									icon: {
										fontSize: themeFontSize(1.3)
									}
								}
							}
						},
						
						post: {
							backgroundColor: primary.hue2,
							//borderColor:     accent.hue1,
							borderColor: Transparent,
							
							user: {
								backgroundColor: primary.hue3,
								//borderColor: accent.hue1,
								borderColor: Transparent,
								transform: 'translate(0.2rem,0)'
							},
							
							details: {
								backgroundColor: primary.hue3,
								color: text.primary,
								
								
							}
						},
						
						comment: {
							backgroundColor: primary.hue2,
							//borderColor:     secondary.hue1,
							borderColor: Transparent,
							
							user: {
								backgroundColor: primary.hue3,
								//borderColor:     secondary.hue1,
								borderColor: Transparent,
								transform: 'translate(0.2rem,0)'
							},
							
							details: {
								//backgroundColor: secondary.hue1,
								backgroundColor: primary.hue3,
								color: text.primary
							}
						}
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
	})))
}

export namespace DefaultTheme {
	export const ThemeName = 'DefaultTheme'
}
export default DefaultTheme