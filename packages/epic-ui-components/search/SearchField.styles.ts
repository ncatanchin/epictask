import {
	FillWidth, PositionRelative, rem, Transparent, OverflowAuto, FlexWrap,
	makeFlexAlign
} from "epic-styles/styles"
export default function baseStyles(topStyles, theme, palette) {
	const
		{ primary, accent, text, background } = palette
	
	
	return [ {
		wrapper: [
			Styles.PositionRelative,
			Styles.FillWidth,
			theme.inputBorder,
			Styles.makeTransition(['height','min-height','max-height']),{
				borderRadius: rem(0.2),
				backgroundColor: primary.hue3,
				//backgroundColor: Transparent
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