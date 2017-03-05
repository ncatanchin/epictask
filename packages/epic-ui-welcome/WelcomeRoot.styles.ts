import { makeWidthConstraint } from "epic-styles/styles"
export default function baseStyles(topStyles, theme, palette) {
	
	const
		{text,primary,accent,secondary,success,warn} = palette
	
	return {
		header: [Styles.makePaddingRem(3),{
			fontSize: rem(3),
			fontWeight: 500,
			color: 'white'
		}],
		
		search: [ {
			
			wrapper: [
				makeWidthConstraint('60%')
			],
			field: [
				makePaddingRem(0), {
					input: [{
						border: `1px solid ${Transparent}`
					}]
				}
			],
			
			hint: [ {} ]
			
		} ]
		
	}
}