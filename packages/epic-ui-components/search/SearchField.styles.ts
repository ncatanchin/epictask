import {
	FillWidth, PositionRelative, rem, Transparent, OverflowAuto, FlexWrap,
	makeFlexAlign
} from "epic-styles/styles"
export default function baseStyles(topStyles, theme, palette) {
	const
		{ primary, accent, text, background } = palette
	
	
	return [ {
		wrapper: [ PositionRelative, FillWidth, {
			borderRadius: rem(0.2),
			backgroundColor: Transparent
		} ],
		
		
		container: [ PositionRelative, OverflowAuto, FillWidth, FlexColumn, {
			maxHeight: '100%'
		} ],
		
		inputContainer: [
			PositionRelative,
			FillWidth,
			FlexWrap,
			makeFlexAlign('flex-start','center')
		],
		
		field: [
			PositionRelative,
			FlexScale,
			{
				minWidth: '30%',
				
				hint: [ {
					backgroundColor: Transparent,
					color: text.secondary,
					fontWeight: 400
				} ],
				
				
				input: [ FillWidth, makeTransition([ 'color', 'background-color', 'border', 'padding' ]), {
					
					// backgroundColor: ,
					//color: text.primary
				} ],
			} ],
		
		
		focused: [ {
			// backgroundColor: primary.hue4,
			// color: text.primary
		} ]
	} ]
}