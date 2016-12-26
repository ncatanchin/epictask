import {
	makeWidthConstraint, colorAlpha, makeHeightConstraint, colorDarken, colorLighten,
	makeBorder
} from "epic-styles/styles"
const
	{
		CSSHoverState,
		CSSFocusState,
		makeTransition,
		makeFlexAlign,
		makePaddingRem,
		makeMarginRem,
		Transparent,
		FlexAuto,
		FlexRowCenter,
		FlexColumnCenter,
		FlexRow,
		FlexColumn,
		FlexScale,
		FillWidth,
		CursorPointer,
		FillHeight,
		PositionRelative,
		OverflowAuto,
		PositionAbsolute
	} = Styles


export default function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, alternateText, primary, warn, secondary, accent, background } = palette,
		
		buttonDimNumber = theme.tabBarHeightNumber,
		buttonDim = rem(buttonDimNumber),
		
		borderSelected = theme.tabBarSeparator,
		inactiveBg = colorDarken(primary.hue1,15)
	
	return [ FlexColumn, FlexScale, FillHeight, {
		tabBar: [FlexRowCenter, FillWidth,makeHeightConstraint(buttonDim),{
			
			borderBottom: borderSelected,
			
			tabs: [FlexRow, FlexScale, OverflowAuto,PositionRelative, makeHeightConstraint(buttonDim), makeFlexAlign('center', 'flex-start'), {
				overflowX: 'auto',
				overflowY: 'visible',
				zIndex: 9999,
				backgroundColor: inactiveBg
			}],
			
			
			
			// bottomBorder: [PositionAbsolute,FillWidth,makeHeightConstraint(rem(0.1)),{
			// 	left: 0,
			// 	bottom: 0,
			// 	zIndex: 1,
			// 	backgroundColor: primary.hue1,
			// }],
			
			newTabButton: [ FlexAuto, FlexRowCenter, CursorPointer, FillHeight, makeWidthConstraint(buttonDim), makeTransition([ 'color', 'background-color' ]), {
				backgroundColor: primary.hue1,
				color: text.primary,
				boxSizing: 'border-box',
				//border: `0.1rem solid ${colorAlpha(accent.hue1,0.7)}`,
				borderLeft: borderSelected,
				
				fontWeight: 900,
				fontSize: rem(1.5),
				minHeight: buttonDim,
				[CSSHoverState]: [ {
					backgroundColor: accent.hue1,
					color: text.primary
				} ]
			} ],
			
			spacer: [ FlexScale ],
			
			[Styles.CSSHoverState]: {},
			
			tab: [
				FlexAuto,
				FlexRow,
				CursorPointer,
				makeFlexAlign('center', 'flex-start'),
				//makeMarginRem(0, 0.2),
				makePaddingRem(0, 2, 0, 2),
				FillHeight,
				PositionRelative,
				makeHeightConstraint(buttonDim), {
					minWidth: rem(15),
					backgroundColor: inactiveBg,
					color: colorLighten(text.secondary,10),
					fontWeight: 400,
					
					borderRight: borderSelected,
					// borderLeft: borderSelected,
					
					textAlign: 'center',
					
					selected: [{
						backgroundColor: primary.hue1,
						color: text.primary,
						fontWeight: 500,
						//zIndex: 300,
						//transform: "translate(0,0.1rem)",
						// borderTop: borderSelected,
						// borderRight: borderSelected,
						//borderLeft: borderSelected
					} ],
					
					
					label: [ FlexAuto, {
						flexGrow: 1
					} ],
					
					viewTitle: [{
						fontWeight: 400
					}],
					
					nameField: [makeHeightConstraint(rem(2)),{
						backgroundColor: primary.hue2,
						color: text.primary,
						
						input: [makePaddingRem(0.2),makeHeightConstraint(rem(2)),{
							backgroundColor: primary.hue2,
							color: text.primary,
							border: 0,
							
							[CSSFocusState]: {
								boxShadow: 'none',
								backgroundColor: primary.hue2,
								color: text.primary,
								border: 0,
							}
						}]
						
					}],
					
					
					[Styles.CSSHoverState]: {},
					
					closeButton: [ PositionAbsolute, FlexRowCenter, makeHeightConstraint(buttonDim), CursorPointer, makeTransition([ 'color', 'background-color', 'opacity', 'font-size', 'font-weight' ]), {
						fontSize: rem(1),
						fontWeight: 700,
						minWidth: rem(2),
						right: 0,
						top: 0,
						opacity: 0,
						color: text.primary,//warn.hue1,
						backgroundColor: Transparent,
						
						visible: [ {
							opacity: 1,
						} ],
						
						[Styles.CSSHoverState]: [ {
							fontSize: rem(1.5),
							fontWeight: 700,
							color: text.primary,
							//backgroundColor: warn.hue1,
						} ]
					} ]
				} ]
		} ],
		
		content: [ FlexScale, FillWidth ]
	} ]
}