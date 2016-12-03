


export function makeComponentStyles(theme,palette) {
	const
		{
			primary,
			accent,
			warn
		} = palette
	
	return {
		// TEXT FIELD INPUT
		input: [ {
			hint: [{
				zIndex: 5,
				textTransform: 'uppercase',
				color: primary.hue4,
				backgroundColor: 'transparent'
			}]
		} ],
		
	}
}