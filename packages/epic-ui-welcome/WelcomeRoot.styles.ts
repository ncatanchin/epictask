import { makeWidthConstraint } from "epic-styles/styles"
export default function baseStyles(topStyles, theme, palette) {
	
	const
		{text,primary,accent,secondary,success,warn} = palette
	
	return {
		
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