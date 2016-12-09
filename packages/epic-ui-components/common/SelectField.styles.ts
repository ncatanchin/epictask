


export default function (topStyles, theme, palette) {
	
	const
		{ primary, accent, text, secondary } = palette
	
	return [
		theme.input,

		Styles.FlexRow,
		Styles.CursorPointer,
		makeFlexAlign('center', 'flex-start'),
		PositionRelative, {
			
			backgroundColor: primary.hue3,
			height: theme.input.minHeight,
			maxHeight: theme.input.minHeight,
			
			
			value: [makePaddingRem(0.5,1), {
				color: text.primary
			}],
			
			control: [
				makePaddingRem(0,1),
				makeTransition(['color']),{
					color: text.secondary,
					
					[CSSHoverState]: [{
						color: text.primary,
					}]
				}
			],
			
			
			items: [theme.input],
			
			item: [ makePaddingRem(0.5,1), {
				backgroundColor: text.primary,
				color: primary.hue1,
				// backgroundColor: primary.hue2,
				// color: text.primary,
				
				selected: {
					// color: text.primary,
					// backgroundColor: accent.hue1
					backgroundColor: accent.hue1,
					color: text.primary
				}
				
			} ],
			
		} ]
}
