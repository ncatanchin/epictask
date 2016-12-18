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
import { sheetURISelector, sheetParamsSelector } from "epic-typedux/selectors"
import { makeHeightConstraint, makeWidthConstraint } from "epic-styles/styles"
import { isDefined, isString } from "typeguard"

// Constants
const
	log = getLogger(__filename)

const baseStyles = (topStyles, theme, palette) => {
	const
		{ text, accent, primary, secondary } = palette,
		transition = makeTransition([ '-webkit-filter','filter','transform', 'left', 'width' ,'top', 'height', 'max-height', 'min-height', 'opacity' ], 0.4)
	
	return [
		PositionAbsolute,
		OverflowHidden,
		
		transition,
		{
			
			root: [transition,makeHeightConstraint('100vh'),makeWidthConstraint('100vw'),{
				position: 'fixed',
				top: 0,
				left: 0,
				pointerEvents: 'none',
				opacity: 0,
				zIndex: 99999999,
				visible: [{
					pointerEvents: 'auto',
					opacity: 1
				}]
			}],
			
			background: [transition,makeHeightConstraint('100vh'),makeWidthConstraint('100vw'),{
				position: 'fixed',
				top: 0,
				left: 0,
				pointerEvents: 'none',
				opacity: 0,
				zIndex: 2,
				backgroundImage: "linear-gradient(to top right, rgba(43, 40, 50, 0.8) 0%, rgba(83, 86, 99, 0.8) 45%, rgba(69, 77, 91, 0.6) 60%)",
				
				visible: [{
					
					opacity: 1,
					WebkitFilter: 'blur(10px)',
					filter: 'blur(10px)',
					pointerEvents: 'auto',
				}]
			}],
			
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
	sheetParams?:any
	allowedURIs?:Array<string|RegExp>
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
	sheetURI: sheetURISelector,
	sheetParams: sheetParamsSelector
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
				CommonKeys.Escape,
				(cmd, event) => getUIActions().closeSheet(),
				 {
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
			Routes = RouteRegistryScope.asRouteMap(),
			{ styles, allowedURIs,sheetParams,sheetURI } = this.props
		
		if (!sheetURI ||
			(isDefined(allowedURIs) &&
				allowedURIs.findIndex(test =>
					isString(test) ?
						test === sheetURI :
						test.test(sheetURI)) === -1)
		) {
			if (sheetURI)
				log.debug(`Access to sheet @ ${sheetURI} is restricted in this sheet.  Allowed URIs are: ${allowedURIs.join(', ')}`)
			
			return React.DOM.noscript()
		}
		
		const
			// TODO: Implement routeView for sheet root
			sheetConfig = Routes[sheetURI] as any,
			sheetPromise = sheetConfig && getValue(() => sheetConfig.provider())
		
		
		return <div style={[styles.root,sheetPromise && styles.root.visible]}>
			<div
				style={[styles.background,sheetPromise && styles.background.visible]}
			  onClick={() => getUIActions().closeSheet()} />
			<CommandRoot
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
					<PromisedComponent
						componentProps={{sheetURI,sheetParams}}
						promise={sheetPromise}
					/>
				</div>
			
			</div>
			}
		</CommandRoot>
		</div>
	}
	
}