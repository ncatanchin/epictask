
export default function baseStyles(topStyles,theme,palette) {
	const
		{ accent, primary, text, secondary } = palette,
		{itemHeight} = theme.search
	
	return [
		makeTransition([ 'background-color', 'color' ]),
		PositionRelative,
		FlexRowCenter,
		FillWidth, {
			height: itemHeight,
			cursor: 'pointer',
			borderTop: `0.1rem solid ${accent.hue1}`,
			color: primary.hue1,
			
			
			normal: {
				backgroundColor: text.primary,
				color: primary.hue1
			},
			
			selected: [{
				backgroundColor: accent.hue1,
				color: text.primary
			}],
			
			
			info: [
				FlexScale,
				FlexColumnCenter,
				makePaddingRem(0.2,2,0.2,1),
				makeFlexAlign('stretch', 'center'), {
					
				}
			],
			
			label: [Ellipsis, FlexAuto, makePaddingRem(0, 1), {
				flexShrink: 1,
				fontWeight: 300,
				fontSize: rem(1.6),
				
				second: [FlexAuto, {
					fontWeight: 100,
					fontSize: rem(1.2)
				}],
				
				selected: [{
					fontWeight: 500
				}]
			}],
			
			action: [{
				fontWeight: 300,
				fontSize: rem(1.3),
				textStyle: 'italic',
				
				selected: [{
					
				}]
			}],
			
			type: [ FillHeight, FlexRowCenter, FlexAuto, Ellipsis, {
				fontWeight: 300,
				fontSize: rem(1.3),
				textStyle: 'italic',
				padding: rem(0.3),
				width: itemHeight,
				background: Transparent,
				//borderRight: `0.1rem solid ${accent.hue1}`,
				
				selected: [{}]
			} ]
			
		} ]
	
}