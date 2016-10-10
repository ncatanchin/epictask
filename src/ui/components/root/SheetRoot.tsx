// Imports
import * as ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import { PureRender } from 'ui/components/common/PureRender'
import { createStructuredSelector } from 'reselect'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { sheetSelector } from "shared/actions/ui/UISelectors"
import { IUISheet } from "shared/config/DialogsAndSheets"
import {
	PositionAbsolute, makeTransition, makeHeightConstraint, createStyles, FillHeight,
	FlexColumn
} from "shared/themes"
import { CommandComponent, CommandContainerBuilder, CommandRoot } from "shared/commands/CommandComponent"
import { ContainerNames } from "shared/config/CommandContainerConfig"

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => {
	const
		{text,accent,primary,secondary} = palette
	
	return [
		PositionAbsolute,
		OverflowHidden,
		makeTransition([ 'transform', 'left', 'width' ]),
		makeTransition([ 'top', 'height','max-height','min-height','opacity' ], 0.4),
		{
			height: 0,
			maxHeight: 0,
			pointerEvents: 'none',
			backgroundColor: text.primary,
			color: primary.hue1,
			
			// OFF PAGE BY DEFAULT
			top: 0,
			left: "50%",
			width: '70%',
			zIndex: 100,
			transform: "translate(-50%,0)",
			opacity: 0,
			
				// VISIBLE THEN MOVE TOP
			visible: [ {
				pointerEvents: 'auto',
				height: "auto",
				maxHeight: "80%",
				//top: "20%",
				opacity: 1
			} ],
			
			
			// CONTENT
			content: [ FillHeight ],
			
			// HEADER
			header: [ {
				title: [ makePaddingRem(1),{
					backgroundColor: accent.hue1,
					color: text.primary,
					fontSize: rem(2),
					fontWeight: 500,
					textTransform: 'uppercase'
				} ]
			} ],
			
			body: [FillWidth,FlexColumn, {
				flexShrink: 1,
				maxHeight: '50vh',
				color: text.secondary
			} ]
			
			
		}
	]
}


/**
 * ISheetRootProps
 */
export interface ISheetRootProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	sheet?:IUISheet
}

/**
 * ISheetRootState
 */
export interface ISheetRootState {
	contentRef:any
}

/**
 * SheetRoot
 *
 * @class SheetRoot
 * @constructor
 **/

@connect(createStructuredSelector({
	sheet: sheetSelector
}))
@CommandComponent()
@ThemedStyles(baseStyles)
@PureRender
export class SheetRoot extends React.Component<ISheetRootProps,ISheetRootState> {
	
	/**
	 * Commands
	 */
	commands = (builder:CommandContainerBuilder) => []
	
	commandComponentId = ContainerNames.SheetRoot
	
	
	setSheetContent = (contentRef) => this.setState({
		contentRef
	})
	
	render() {
		const
			{ styles,sheet } = this.props,
			SheetElement = sheet && sheet.rootElement()
		
		return <CommandRoot
			component={this}
			id="sheetRoot"
			style={[styles, sheet && styles.visible]}>
			{SheetElement && <div ref={this.setSheetContent} style={[styles.content]}>
				<div style={[styles.header]}>
					<div style={[styles.header.title]}>{sheet.title}</div>
				</div>
				<div style={[styles.body]}>
					<SheetElement/>
				</div>
			</div>
			 }
		</CommandRoot>
	}
	
}