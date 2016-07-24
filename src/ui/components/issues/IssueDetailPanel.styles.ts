
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
			assignee: [{
				padding: '0 0 0 1rem'
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
				}
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

					margin: '1rem 1rem 1rem 0.5rem',

					avatar: {
						width:        41,
						height:       41,
						borderRadius: '50%'
					},

					user: {
						// borderWidth: '0.1rem',
						// borderStyle: 'solid',
						borderRadius: '50% 0 0 50%'
					}
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