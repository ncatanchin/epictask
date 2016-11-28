

const inputStyle = {
	display: 'flex',
	flexDirection: 'row',
	flex: '1 0 20rem',
	minWidth: rem(20),
	width: 'auto !important',
	boxSizing: 'border-box'
}

let
	styleSheet:IGlobalThemedStyle

const baseStyles = (topStyles,theme,palette) => {
	
	/**
	 * Add a root class name to handle children
	 */
	
	const
	
		styles = createStyles({
			
			root: [inputStyle,{
				padding: '0.3rem 1rem'
			}],
			
			className: 'typeAheadSelect',
			
			hint: [makeTransition('opacity'), {
				zIndex: 3,
				bottom: 5,
				opacity: 0,
				transform: 'translate(1rem,-0.4rem)',
				
				visible: {
					opacity: 1
				}
			}],
			
			list: [{
				paddingTop: 0,
				paddingBottom: 0,
				backgroundColor: 'transparent !important'
			}]
		})
	
	// IF ALREADY EXISTS, REMOVE
	if (styleSheet) {
		styleSheet.remove()
	}
		
	// CREATE STYLE SHEET
	styleSheet = CreateGlobalThemedStyles((aTheme,Style) => ({
		[`.${styles.className}`]: createStyles([{
			'input': [FlexRow,inputStyle, {
				flexGrow: 1
			}]
		}])
	}))
	
	return styles
}
export default baseStyles