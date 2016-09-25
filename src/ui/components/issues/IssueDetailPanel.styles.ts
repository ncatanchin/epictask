
import {baseStyles as labelBaseStyles} from 'ui/components/common/LabelChip'

const flexTransition = makeTransition(['height', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis'])

const baseStyles = createStyles({

	root: [FlexColumn, Fill, OverflowHidden, {
		minWidth: '36.5rem'
	}],

	time: [FlexAuto, {
		paddingLeft: 5,
		fontSize:   themeFontSize(1),
		fontWeight: 100
	}],

	issue: [flexTransition, FlexColumn, FlexScale, {}],

	issueMulti: [FlexColumn, FlexScale, {}],

	header: [flexTransition, FlexAuto, FlexColumn, {
		padding: "1rem",

		row1: [FlexRowCenter, FlexAuto, {
			repo:     [FlexScale, {
				fontSize:            themeFontSize(1.4),
				padding:             '0 0 0.5rem 0',
				fontWeight:          500,
				fontSmooth:          'always',
				WebkitFontSmoothing: 'antialiased'
			}],
			assignee: [makeMarginRem(0,0,0,1),{
			}]
		}],

		row2: [FlexRowCenter, FlexAuto, PositionRelative, {
			padding: '0.5rem 0 1rem 0',
			title:   [OverflowHidden, PositionRelative, FlexScale, {
				fontSize:     themeFontSize(2),
				textOverflow: 'clip ellipsis',
				lineHeight:   '2.2rem',
				maxHeight:    '4.4rem',
				maxWidth:     '100%'
			}],


		}],

		// Row 3 - Labels + title
		row3: [flexTransition, FlexRowCenter, FlexAuto, {
			labels:    [FlexScale, FlexAlignStart, {
				flexWrap: 'wrap',
				label: {
					marginTop: rem(0.5)
				},
				add: [
					labelBaseStyles.label,
					FlexRowCenter,
					FlexAuto,
					makeTransition(['transform','font-size','font-weight','opacity']),
					makeMarginRem(0.5,0.5,0,0),
					{
						//margin: makeMarginRem(0.5,0.5,0,0),//"0.5rem 0.5rem 0 0",
						padding: 0,
						height: rem(2.4),
						width: rem(2.4),
						position: 'relative',
						fontSize: rem(1.2),
						opacity: 0.5,
						fontWeight: 900,
						cursor: 'pointer',

						':hover': {
							opacity: 1,
							transform: 'scale(1.1)'
						}

					}
					]
			}],
			milestone: makeStyle({})


		}]

	}],

	/**
	 * ISSUE DETAILS / COMMENTS / BODY
	 */
	content: [flexTransition, FlexColumn, FlexScale, {
		wrapper: [FlexColumn, FlexScale, {
			padding:   '1rem 0rem',
			overflowX: 'hidden',
			overflowY: 'auto'
		}],

		body: [flexTransition, FlexAuto, {
			boxShadow: 'inset 0 -0.1rem 0.4rem -0.4rem black',
			padding:   '1rem 1rem 1rem 2rem'
		}],

		activities: [flexTransition, FlexColumn, FlexAuto, {
			activity: [
				flexTransition,
				FlexRow,
				makeFlexAlign('flex-start', 'flex-start'),
				FlexAuto, {

					title: [flexTransition, FlexColumn, FlexAuto, {}],
					
					
					avatar: {
						width:        40,
						height:       40,
						borderRadius: '50%'
					},

					user: {
						// borderWidth: '0.1rem',
						// borderStyle: 'solid',
						borderRadius: '50% 0 0 50%',
						borderTopWidth: rem(0.1),
						borderBottomWidth: rem(0.1),
						borderLeftWidth: rem(0.1),
						borderRightWidth: 0,
						borderStyle: 'solid'
					},
					
					':hover': {}
				}
			]
		}],
	}],

	/**
	 * PANEL FOOTER
	 */
	footer: [flexTransition, FlexAuto, {}],


	/**
	 * Markdown styling
	 */
	markdown: [{
		padding:   '1rem',
		overflowY: 'visible',
		overflowX: 'auto',
		height:    'auto',

		'pre': {
			width:     '100%',
			boxSizing: 'border-box'
		}
	}]

})

export default baseStyles