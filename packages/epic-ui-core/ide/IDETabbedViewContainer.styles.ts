import { makeWidthConstraint, colorAlpha, makeHeightConstraint } from "epic-styles/styles"
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
		
		buttonDimNumber = 2.5,
		buttonDim = rem(buttonDimNumber)
	
	return [ FlexColumn, FlexScale, FillHeight, {
		tabs: [ FlexRowCenter, FlexAuto, FillWidth, OverflowAuto, PositionRelative, {
			paddingLeft: convertRem(buttonDimNumber),
			
			minHeight: buttonDim,
			
			newTabButton: [ FlexAuto, FlexRowCenter, CursorPointer, FillHeight, PositionAbsolute, makeWidthConstraint(buttonDim), makeTransition([ 'color', 'background-color' ]), {
				backgroundColor: primary.hue2,
				color: accent.hue1,
				boxSizing: 'border-box',
				//border: `0.1rem solid ${colorAlpha(accent.hue1,0.7)}`,
				
				
				top: 0,
				left: 0,
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
				makeMarginRem(0, 0.2),
				makePaddingRem(0, 0, 0, 0.5),
				FillHeight,
				makeHeightConstraint(buttonDim), {
					minWidth: rem(15),
					backgroundColor: primary.hue2,
					
					selected: [ {
						backgroundColor: primary.hue3
					} ],
					
					
					label: [ FlexAuto, {
						flexGrow: 1
					} ],
					
					nameField: [makeHeightConstraint(rem(2)),{
						backgroundColor: primary.hue2,
						color: text.primary,
						
						input: [makePaddingRem(0.2),makeHeightConstraint(rem(2)),{
							backgroundColor: primary.hue2,
							color: text.primary,
							
							[CSSFocusState]: {
								backgroundColor: primary.hue2,
								color: text.primary
							}
						}]
						
					}],
					
					
					[Styles.CSSHoverState]: {},
					
					closeButton: [ FlexAuto, FlexRowCenter, makeHeightConstraint(buttonDim), CursorPointer, makeTransition([ 'color', 'background-color', 'opacity', 'font-size', 'font-weight' ]), {
						fontSize: rem(1),
						fontWeight: 700,
						minWidth: rem(2),
						opacity: 0,
						color: warn.hue1,
						backgroundColor: Transparent,
						
						visible: [ {
							opacity: 1,
						} ],
						
						[Styles.CSSHoverState]: [ {
							fontSize: rem(1.5),
							fontWeight: 700,
							color: text.primary,
							backgroundColor: warn.hue1,
						} ]
					} ]
				} ]
		} ],
		
		content: [ FlexScale, FillWidth ]
	} ]
}