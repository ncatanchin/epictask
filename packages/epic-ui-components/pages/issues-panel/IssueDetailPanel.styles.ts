

import {
	makeWidthConstraint, makeHeightConstraint, makeMarginRem, PositionRelative, OverflowAuto,
	FlexColumnCenter, FlexScale, OverflowHidden, Fill, FlexColumn, makeTransition, makePaddingRem, FillWidth,
	FlexRowCenter, Ellipsis, Transparent, FlexAuto, FlexAlignStart
} from "epic-styles"

const flexTransition = makeTransition(['height', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis'])

const baseStyles = (topStyles,theme,palette) => {
	
	const
		{text,accent,primary,secondary,background} = palette,
		flexTransition = makeTransition(['height', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis'])
	
	return {
		
			
		root: [ flexTransition,FlexColumn, Fill, OverflowHidden, {
			backgroundColor: background,
			minWidth: '36.5rem'
		} ],
		
		// MULTI
		multi: [PositionRelative, FlexColumnCenter, FlexScale,{
			title: [ {
				fontSize: rem(3),
				textAlign: 'center'
			} ],
			button: [makeMarginRem(1,1,0,1),{
				
			}],
		}],
		
		
		
		// SINGLE ISSUE
		time: [ FlexAuto, {
			paddingLeft: 5,
			fontSize: themeFontSize(1),
			fontWeight: 100
		} ],
		
		input: [ {
						
		} ],
		
		issue: [ flexTransition, FlexColumn, FlexScale, {} ],
		
		
		
		
		/**
		 * ISSUE DETAILS / COMMENTS / BODY
		 */
		content: [ flexTransition, FlexColumn, FlexScale, {
			wrapper: [ FlexColumn, FlexScale, {
				padding: '1rem 0rem',
				overflowX: 'hidden',
				overflowY: 'auto'
			} ],
			
			body: [ flexTransition, FlexAuto, {
				boxShadow: 'inset 0 -0.1rem 0.4rem -0.4rem black',
				padding: '1rem 1rem 1rem 2rem'
			} ],
			
			activities: [ flexTransition, FlexColumn, FlexAuto, {
				activity: [
					flexTransition,
					FlexRow,
					makeFlexAlign('flex-start', 'flex-start'),
					FlexAuto, {
						
						title: [ flexTransition, FlexColumn, FlexAuto, {} ],
						
						
						avatar: {
							width: 40,
							height: 40,
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
			} ],
		} ],
		
		/**
		 * PANEL FOOTER
		 */
		footer: [ flexTransition, FlexAuto, {} ],
		
		
		/**
		 * Markdown styling
		 */
		markdown: [ {
			padding: '1rem',
			overflowY: 'visible',
			overflowX: 'auto',
			height: 'auto',
			
			'pre': {
				width: '100%',
				boxSizing: 'border-box'
			}
		} ]
		
	}
}

export default baseStyles