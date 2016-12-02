
/**
 * Base styles
 *
 * @param topStyles
 * @param theme
 * @param palette
 */
export function chipStyles(topStyles, theme, palette) {
	
	const
		{primary} = palette,
		accessoryDim = rem(2.4),
		accessoryDimHalf = rem(1.2),
		accessoryTransition = makeTransition([
			'background-color',
			'font-weight',
			'font-size',
			'border-radius',
			'opacity',
			'width',
			'padding',
			'background-color',
			'color'
		])
	
	return [ makeTransition('width'), PositionRelative, FlexAuto, FlexRowCenter, {
		display: 'flex',
		borderRadius: accessoryDimHalf,
		height: accessoryDim,
		//borderRadius: '0.3rem',
		marginTop: 0,
		marginRight: rem(1),
		marginBottom: 0,
		marginLeft: 0,
		boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)',
		backgroundColor: primary.hue3,
		[CSSHoverState]: [{
			
		}],
		
		collapsed: [ {
			width: rem(2.4)
		} ],
		
		
		
		// Accessories
		accessory: [
			accessoryTransition,
			FlexAuto, FlexRowCenter,
			makePaddingRem(0, 0, 0, 0), {
				height: accessoryDim,
				width: accessoryDim,
				borderRadius: accessoryDimHalf,
				
				// icon decoration
				icon: [ accessoryTransition, FlexColumnCenter, makePaddingRem(0, 0, 0, 0), {
					height: accessoryDim,
					width: accessoryDim,
					fontSize: accessoryDimHalf
				} ],
				
				hover: [ {
					borderRadius: 0,
					fontWeight: 700,
					fontSize: rem(1.5),
					icon: [ {} ]
				} ],
				
				// REMOVE CONTROL
				remove: [ OverflowHidden, {
					//hovering && {backgroundColor: palette.errorColor,color:palette.textColor}
					fontSize: themeFontSize(1),
					cursor: 'pointer',
					
					// ICON REMOVE
					icon: [ {} ],
					
					// HOVER REMOVE
					hover: [ {
						icon: [ {} ]
					} ]
				} ]
				
				
			} ],
		
		text: [ makePaddingRem(0, 1.2, 0, 1.2), {
			textAlign: 'baseline',
			withLeftIcon: [ makePaddingRem(0, 1.2, 0, 0.6) ]
		} ]
		
	}]
}

