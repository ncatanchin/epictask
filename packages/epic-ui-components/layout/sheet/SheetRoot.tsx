// Imports
import { connect } from "react-redux"
import { PureRender, PromisedComponent } from "epic-ui-components/common"
import { createStructuredSelector } from "reselect"
import { ThemedStyles, PositionAbsolute, makeTransition, FillHeight, FlexColumn, IThemedAttributes } from "epic-styles"
import { getUIActions } from "epic-typedux"
import {  getValue } from "epic-global"
import {
	CommandComponent, CommandRoot,
	CommandContainerBuilder
} from  "epic-command-manager-ui"

import {
	CommandType,
	ContainerNames,
	CommonKeys
} from "epic-command-manager"
import {  Routes } from "epic-entry-ui/routes/Routes"
import { sheetURISelector } from "epic-typedux/selectors"

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles, theme, palette) => {
	const
		{ text, accent, primary, secondary } = palette
	
	return [
		PositionAbsolute,
		OverflowHidden,
		makeTransition([ 'transform', 'left', 'width' ]),
		makeTransition([ 'top', 'height', 'max-height', 'min-height', 'opacity' ], 0.4),
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
				title: [ makePaddingRem(1), {
					backgroundColor: accent.hue1,
					color: text.primary,
					fontSize: rem(2),
					fontWeight: 500,
					textTransform: 'uppercase'
				} ]
			} ],
			
			body: [ FillWidth, FlexColumn, {
				flexShrink: 1,
				maxHeight: '50vh',
				color: text.primary
			} ]
			
			
		}
	]
}


/**
 * ISheetRootProps
 */
export interface ISheetRootProps extends IThemedAttributes {
	sheetURI?:string
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
	sheetURI: sheetURISelector
}))
@CommandComponent()
@ThemedStyles(baseStyles)
@PureRender
export class SheetRoot extends React.Component<ISheetRootProps,ISheetRootState> {
	
	/**
	 * Commands
	 */
	commandItems = (builder:CommandContainerBuilder) =>
		builder
		// CLOSE THE SHEET
			.command(
				CommandType.Container,
				'Hide sheet...',
				(cmd, event) => getUIActions().closeSheet(),
				CommonKeys.Escape, {
					hidden: true,
					overrideInput: true
				})
			.make()
	
	commandComponentId = ContainerNames.SheetRoot
	
	
	setSheetContent = (contentRef) => this.setState({
		contentRef
	})
	
	render() {
		const
			{ styles, sheetURI } = this.props,
			// TODO: Implement routeView for sheet root
			sheetConfig = Routes[sheetURI] as any,
			sheetPromise = sheetConfig && getValue(() => sheetConfig.provider())
		
		
		return <CommandRoot
			component={this}
			id="sheetRoot"
			style={[styles, sheetPromise && styles.visible]}>
			
			{sheetPromise && <div
				ref={this.setSheetContent}
				style={[styles.content]}>
				
				<div style={[styles.header]}>
					<div style={[styles.header.title]}>{sheetConfig.title}</div>
				</div>
				
				<div style={[styles.body]} autoFocus>
					<PromisedComponent promise={sheetPromise}/>
				</div>
			
			</div>
			}
		</CommandRoot>
	}
	
}