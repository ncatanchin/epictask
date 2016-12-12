
/**
 * Base styles
 *
 * @param topStyles
 * @param theme
 * @param palette
 */
export function chipStyles(topStyles, theme, palette) {
	
	const
		{primary,warn,secondary,accent,text} = palette,
		accessoryDim = convertRem(1.8),
		accessoryDimHalf = accessoryDim / 2,
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
	
	return [
		makeTransition('width'),
		PositionRelative,
		FlexAuto,
		FlexRowCenter,
		makeMarginRem(0,1,0,0),{
		display: 'flex',
		borderRadius: accessoryDimHalf,
		height: accessoryDim,
		
			//borderRadius: '0.3rem',
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
				backgroundColor: Styles.Transparent,
				
				// icon decoration
				icon: [ accessoryTransition, FlexColumnCenter, makePaddingRem(0, 0, 0, 0), {
					height: accessoryDim,
					width: accessoryDim,
					fontSize: accessoryDimHalf
				} ],
				
				
				hover: [ {
					borderRadius: 0,
					fontWeight: 700,
					fontSize: rem(1.1),
					icon: [ {} ]
				} ],
				
				// REMOVE CONTROL
				remove: [ OverflowHidden, {backgroundColor: 'white',
					color: warn.hue1,
					
					//hovering && {backgroundColor: palette.errorColor,color:palette.textColor}
					fontSize: rem(1),
					cursor: 'pointer',
					
					// ICON REMOVE
					icon: [ {} ],
					
					// HOVER REMOVE
					hover: [ {
						
						
						icon: [ {
							//backgroundColor: 'white',
							//color: warn.hue1,
						} ]
					} ]
				} ]
				
				
			} ],
		
		text: [ makePaddingRem(0, 1.2, 0, 1.2), {
			fontSize: rem(1),
			textAlign: 'baseline',
			withLeftIcon: [ makePaddingRem(0, 1.2, 0, 0.6) ]
		} ]
		
	}]
}

