import {
	createStyles, FlexAuto, FlexColumn, makePaddingRem, FlexScale, rem, FlexAlignCenter,
	FlexRow, FlexAlignEnd, FillWidth, Ellipsis, FlexRowCenter, OverflowHidden, FillHeight, PositionRelative,
	makeTransition
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
		summary:IStyle & {
			label: IStyle & {
				text: IStyle
				progress: IStyle
			}
			progress: IStyle
		}
	}
	
}

const openStyle = {
	// height: rem(3.6),
	// fontSize: rem(1.2)
}

/**
 * Create the styles
 */
export default createStyles({
	root: [
		makeTransition(['height','font-size','font-weight','background-color','color']),
		FlexRowCenter,
		FlexAuto,
		OverflowHidden,
		{
			height: rem(2.6),
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
	
	status: [FlexRowCenter,OverflowHidden,PositionRelative,{
		padding: rem(0.4),
		height: rem(2.6),
		maxHeight: rem(2.6),
		
		item: [FlexRowCenter,FlexAuto,OverflowHidden, FillHeight, {
			borderColor: 'transparent',
			borderWidth: rem(0),
			borderStyle: 'solid',
			borderRadius: rem(0.3)
		}]
	}],
	
	toast: [{
		root: [{
			margin: 0,
			cursor: 'pointer'
		}],
		content: [{
			height: rem(2),
			backgroundColor: 'transparent'
		}],
		action: [{
			height: rem(2)
		}],
	}],
	
	// Jobs Status Item
	jobs: [{
		summary: [
			makeTransition(['height','width','flex-grow','flex-shrink','flex-basis']),
			FlexColumnCenter,
			Ellipsis,
			{
				minWidth: rem(24),
				padding: '0 0.5rem',
				
				
				// Job Description
				label: [makeTransition(['height','width','flex-grow','flex-shrink','flex-basis']),FlexRowCenter,FillWidth,{
					text: [Ellipsis,{
						flex: '1 1 auto'
					}],
					time: [FlexAuto],
					icon: [{
						
					}],
					progress: [FlexAuto, {
						completed: {
							fontSize: rem(1.1),
						},
						paddingLeft: rem(1)
					}]
					
				}],
				
				// Job Progress Bar
				progressBar: [
					//makeTransition(['opacity','padding-right','padding-left','min-height','max-height','height','width','flex-grow','flex-shrink','flex-basis']),
					makeTransition(),
					OverflowHidden,
					makePaddingRem(0.3,0,0.3,0),
					{
						flexGrow: 1,
						flexShrink: 0,
						flexBasis: rem(5),
						minHeight: 'auto',
						maxHeight: 'auto',
						minWidth: rem(5),
						height: rem(0.4),
						opacity: 1,
						
						hidden: [makePaddingRem(),{
							minWidth: 0,
							flexGrow: 0,
							flexShrink: 0,
							flexBasis: 0,
							margin: 0,
							opacity: 0,
							height: 0,
							maxHeight: 0,
							minHeight: 0
						}]
					}
				]
			}
		]
	}]
	
}) //as IStatusBarStyles
