


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
			padding: '0.3rem 1rem',
			fontWeight: 400,
			
			hint: [{
				zIndex: 5,
				textTransform: 'uppercase',
				color: primary.hue4,
				backgroundColor: 'transparent'
			}]
		} ],
		
		label: [ {
			//left: rem(1),
			
			focus: [ {
				transform: 'perspective(1px) scale(0.75) translate3d(-10px, -40px, 0px)'
			} ],
		} ],
		
		
		
		// TEXT FIELD UNDERLINE
		underline: [ {
			focus: [{
				width: 'auto',
				left: rem(1),
				right: rem(1)
			}],
			
			disabled: [{
				
			}]
		} ]
	}
}