import {
	createStyles, FlexAuto, FlexColumn, makePaddingRem, FlexScale, rem, FlexAlignCenter,
	FlexRow, FlexAlignEnd, FillWidth, Ellipsis, FlexRowCenter, OverflowHidden, FillHeight, PositionRelative,
	makeTransition, makeHeightConstraint
} from "epic-styles"


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


/**
 * Create the styles
 */
export default function (topStyles,theme,palette) {
	return {
		root: [
			//['flex-basis','flex-shrink','height','font-size','font-weight','background-color','color']
			makeTransition(['opacity','height','max-height','min-height']),
			makeHeightConstraint(rem(2.6)),
			makePaddingRem(0.5, 0.5),
			FlexRowCenter,
			FlexAuto,
			FillWidth,
			OverflowHidden,
			{
				fontSize: rem(0.8),
				borderTopStyle: 'solid',
				borderTopWidth: rem(0.1),
				opacity: 1,
				
				// Jobs are InProgress
				inProgress: [ {
					height: rem(3),
					fontSize: rem(1)
				} ],
				
				
				// User hidden
				hidden: [
					makePaddingRem(),
					makeHeightConstraint(0),
					{
						opacity: 0,
						borderTopWidth: 0
					}
				]
			}
		],
		
		spacer: [ FlexScale ],
		
		status: [ FlexRowCenter, OverflowHidden, PositionRelative, {
			padding: rem(0.4),
			height: rem(2.6),
			maxHeight: rem(2.6),
			
			item: [ FlexRowCenter, FlexAuto, OverflowHidden, FillHeight, {
				borderColor: 'transparent',
				borderWidth: rem(0),
				borderStyle: 'solid',
				borderRadius: rem(0.3)
			} ]
		} ],
		
		toast: [ {
			root: [makeMarginRem(0), {
				
				cursor: 'pointer'
			} ],
			content: [ {
				height: rem(2),
				backgroundColor: 'transparent'
			} ],
			action: [ {
				height: rem(2)
			} ],
		} ],
		
		// Jobs Status Item
		jobs: [ {} ]
		
	}
}//as IStatusBarStyles
