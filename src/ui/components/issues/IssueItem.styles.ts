import { colorAlpha } from "shared/themes/styles/ColorTools"
export default function baseStyles(topStyles, theme, palette) {
	
	const
		{background,primary,accent,secondary,text} = palette
	
	return [
		makeTransition(['height', 'flex-grow', 'flex-shrink', 'flex-basis','box-shadow']),
		FlexRowCenter,
		FlexAuto,
		FillWidth,
		FillHeight,
		FlexAlignStart,
		makePaddingRem(1,1,0,0.6),
		{
			// COLORS
			backgroundColor: background,
			color: text.secondary,
			//boxShadow: 'inset 0rem -0.1rem 0rem 0rem ' + colorAlpha(primary.hue2,1),
			
			// LAYOUT
			height: rem(9.4),
			cursor: 'pointer',
			
			
			bar: [PositionAbsolute,{
				top: 0,
				left: 0,
				bottom: 0,
				zIndex: 10,
				borderLeft: `0.6rem inset ${Transparent}`
				
			}],
			
			// MARKED AS FOCUSED
			focused: [{
				color: text.primary,
				bar: [{
					borderLeft: `0.6rem inset ${accent.hue1}`
				}]
			}],
			
			// SELECTED
			selected: [{
				backgroundColor: primary.hue2,
				color: text.primary,
				
				bar: [{
					borderLeft: `0.6rem inset ${colorAlpha(secondary.hue2,0.8)}`
				}],
				//boxShadow: 'inset 0rem 0rem 0.1rem 0.1rem ' + colorAlpha(secondary.hue1,0.4),
				
				multi: [{
					backgroundColor: primary.hue2,
					color: text.primary
				}]
			}],
			
			details: [FlexColumn, FlexScale, OverflowHidden, {
				padding: '0 0.5rem'
			}],
			
			// AVATAR
			avatar: [{
				padding: '0'
			}],
			
			number: [{
				fontSize: themeFontSize(1.1),
				fontWeight: 500,
				color: text.primary
			}],
			
			
			row1: [FlexRow, makeFlexAlign('center', 'center'), {
				pointerEvents: 'none',
				padding: '0 0 0.5rem 0rem'
			}],
			
			repo: [Ellipsis, FlexRow, FlexScale, makeTransition(['color','font-size']), {
				fontSize: themeFontSize(1),
				color: text.secondary,
				//fontFamily: fontFamilyRegular,
				fontWeight: 300,
				selected: [{
					fontWeight: 300,
					fontSize: themeFontSize(1.1),
					color: secondary.hue1,
				}]
			}],
			
			row2: [makeTransition(['height']), FlexRowCenter, FillWidth, OverflowHidden, {
				padding: '0 0 1rem 0',
				pointerEvents: 'none'
			}],
			
			title: [makeTransition(['font-size', 'font-weight']), Ellipsis, FlexScale, {
				display: 'block',
				padding: '0 1rem 0 0',
				
				color: text.primary,
				fontWeight: 400,
				fontSize: themeFontSize(1.2),
				
				selected: [{
					fontWeight: 500,
					color: text.primary,
					
					fontSize: themeFontSize(1.2),
					
					multi: [{
						
					}]
				}],
			}],
			
			time: [FlexAuto, {
				fontSize: themeFontSize(1),
				fontWeight: 100,
			}],
			
			
			row3: makeStyle(FlexRowCenter, {
				margin: '0rem 0 0.3rem 0',
				overflow: 'auto'
			}),
			
			
			/**
			 * labels
			 */
			
			labels: [makePaddingRem(), FlexScale, {
				overflowX: 'auto',
				
				wrapper: [FlexScale,{
					overflow: 'hidden',
					marginRight: rem(1)
				}],
				//flexWrap: 'wrap',
				
				label: {
					marginTop: 0,
					marginRight: '0.7rem',
					marginBottom: '0.5rem',
					marginLeft: 0
				}
				
			}],
			
			/**
			 * Milestone
			 */
			milestone: [FlexAuto, Ellipsis, {
				fontSize: themeFontSize(1),
				padding: '0 1rem',
				color: text.secondary
			}],
			
			state: [{
				root:[{
					marginLeft: rem(0.5)
				}]
			}]
		}
	]
}
