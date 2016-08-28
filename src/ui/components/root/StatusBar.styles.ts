import {
	createStyles, FlexAuto, FlexColumn, makePaddingRem, FlexScale, rem, FlexAlignCenter,
	FlexRow, FlexAlignEnd
} from "shared/themes"


/**
 * Style definition for the status bar
 */
export interface IStatusBarStyles {
	root:IStyle & {
		':hover':IStyle
		inProgress:IStyle
		open:IStyle
		hidden:IStyle
	}
	
	spacer:IStyle
	
	status:IStyle
	
	jobs:IStyle & {
		summary:IStyle
	}
	
}

const openStyle = {
	height: rem(3.6),
	fontSize: rem(1.2)
}

/**
 * Create the styles
 */
export default createStyles({
	root: [
		makeTransition(['height','font-size','font-weight','background-color','color']),
		FlexRowCenter, FlexAuto, {
			height: rem(2.4),
			fontSize: rem(0.8),
			
			position: 'fixed',
			right: 0,
			left: 0,
			bottom: 0,
			padding: makePaddingRem(0.5,0.5),
			
			// Mouse Hover
			':hover': [openStyle],
			
			// Jobs are InProgress
			inProgress: [{
				height: rem(3),
				fontSize: rem(1)
			}],
			
			// User opened
			open: [openStyle],
			
			// User hidden
			hidden: [makePaddingRem(),{
				height: 0
			}]
		}
	],
	
	spacer: [FlexScale],
	
	status: [makePaddingRem(0.4,0.4),FlexRow,FlexAlignCenter,{
		borderWidth: rem(0.2),
		borderStyle: 'solid'
		
	}],
	
	// Jobs Summary line
	jobs: [{
		summary: [FlexColumn,FlexAlignEnd,Ellipsis,{
			textAlign: 'right'
		}]
	}]
	
}) as IStatusBarStyles
