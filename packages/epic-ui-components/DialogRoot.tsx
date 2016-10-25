// Imports
import { ThemedStyles } from "epic-styles"
import { CircularProgress} from "material-ui"
import { makeHeightConstraint, makeWidthConstraint, createStyles } from "epic-styles"

import { Icon } from "./Icon"
import { WindowControls } from "./WindowControls"

// Constants
const
	log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => {
	const
		{text,accent,primary,secondary,background} = palette,
		actionStyle = {
			backgroundColor: Transparent,
			color: text.primary
		}
	
	return {
		root: [ FillWindow, FlexColumn, {
			minHeight: 500,
			backgroundColor: background
		} ],
		
		titleBar: [ FlexRowCenter, FillWidth, makeHeightConstraint(rem(5)), {
			backgroundColor: background,
			//backgroundImage: makeLinearGradient('to top', background, primary.hue1),
			//boxShadow: `inset 0 0.1rem 0 ${primary.hue2}`,
			borderBottom: `0.1rem solid ${TinyColor(primary.hue1).setAlpha(0.2).toRgbString()}`
			
			// borderBottomImage: makeLinearGradient('to bottom', primary.hue1, primary.hue2),
		} ],
		
		// WINDOW CONTROLS ARE FAR LEFT
		windowControls: [ makeWidthConstraint(rem(10)), {} ],
		
		// TITLE IS BETWEEN WINDOW CONTROLS AND TITLE ACTION NODES
		title: [ FillHeight, FlexScale, FlexRowCenter, makePaddingRem(0), {
			
			cursor: 'move',
			
			WebkitUserSelect: 'none',
			WebkitAppRegion: 'drag',
			
			
			vertical: [ FlexColumn, makeFlexAlign('flex-start', 'center') ],
			horizontal: [ FlexRow, makeFlexAlign('center', 'flex-start') ],
			
			// TITLE LABEL/SUB-LABEL
			label: [ FlexRow, FlexScale, Ellipsis, {
				fontSize: themeFontSize(2.1),
				fontWeight: 400,
				color: accent.hue1,
				textTransform: 'uppercase',
				
				vertical: [ FillWidth ],
				horizontal: [ FlexScale ]
			} ],
			
			subLabel: [ FlexColumnCenter, Ellipsis,FillHeight, {
				color: text.secondary,
				vertical: [ FillWidth, makePaddingRem(0.5, 0, 0, 0) ],
				horizontal: [ FlexAuto, makePaddingRem(0, 0, 0, 0), {
					textAlign: 'right'
				} ]
			} ],
			
			avatar: [{
				color: text.secondary,
				avatar: {
					borderColor: Transparent
				}
			}]
			
		} ],
		
		
		
		form: [ FlexScale, FlexColumn, FillWidth, PositionRelative, OverflowAuto, {
			backgroundColor: background,
			fontSize: themeFontSize(2),
			color: text.primary,
			
			row: [ {
				height: 72
			} ],
			
			
		} ],
		
		// ACTION NODES
		titleActions: [FillHeight,FlexAuto,FlexRowCenter,actionStyle],
		titleAction: [FillHeight],
		actions: [ FlexRow, makePaddingRem(0, 1), makeFlexAlign('center', 'flex-end'), actionStyle,{
			
			height: rem(5)
		} ],
		
		savingIndicator: [ PositionAbsolute, FlexColumnCenter, Fill, makeAbsolute(), {
			opacity: 0,
			pointerEvents: 'none'
		} ]
		
	}
}


/**
 * Default Action Styles
 */

function actionBaseStyles(topStyles,theme,palette) {
	const
		{
			accent,
			warn,
			text,
			secondary
		} = palette
		
	return {
		action: [makePaddingRem(1,1.5),FlexColumnCenter,FillHeight,{
			cursor: 'pointer',
			
			icon: [makeHeightConstraint(rem(1.8)),{
				fontSize: rem(1.8),
				cursor: 'pointer',
			}],
			
			
			cancel: [makeTransition('background-color'),{
				[CSSHoverState]: [{
					backgroundColor: warn.hue1
				}]
			}],
			
			save: [makeTransition('background-color'),{
				[CSSHoverState]: [{
					backgroundColor: accent.hue1
				}]
			}]
			
		}]
	}
}

/**
 * Create a cancel/close button
 * @param theme
 * @param palette
 * @param cancelAction
 * @returns {any}
 */
export function createCancelButton(theme,palette,cancelAction) {
	const
		styles = createStyles(actionBaseStyles,{},theme,palette)
	
	return <div
		onClick={cancelAction}
		key='cancelButton'
		style={[
			styles.action,
			styles.action.cancel
		]}>
		<Icon style={[styles.action.icon]}>close</Icon>
	</div>
}

/**
 * Create default actions
 *
 * @param theme
 * @param palette
 * @param saveAction
 * @param cancelAction
 */
export function createSaveCancelActions(theme,palette,saveAction, cancelAction) {
	const
		styles = createStyles(actionBaseStyles,{},theme,palette)
	
	return [
		createCancelButton(theme,palette,cancelAction),
		<div onClick={saveAction} key='saveButton' style={[styles.action,styles.action.save]}>
			<Icon style={[styles.action.icon]}>save</Icon>
		</div>
	]
	
}

/**
 * IDialogRootProps
 */
export interface IDialogRootProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	
	titleNode:React.ReactNode|string
	subTitleNode?:React.ReactNode|string
	titleMode?:'vertical'|'horizontal'
	saving?:boolean
	titleActionNodes?:any
	actionNodes?:any
}



/**
 * IDialogRootState
 */
export interface IDialogRootState {
	
}

/**
 * DialogRoot
 *
 * @class DialogRoot
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'dialog')
export class DialogRoot extends React.Component<IDialogRootProps,IDialogRootState> {
	
	render() {
		const
			{ titleNode,subTitleNode,actionNodes,titleActionNodes,saving,theme, styles } = this.props,
			titleMode = this.props.titleMode || 'vertical'
		
		return <div style={styles.root}>
			{/*<MuiThemeProvider theme={theme}>*/}
				<WindowControls />
				<div style={[Fill,FlexColumn,FlexScale]}>
					{/* TITLE BAR */}
					<div style={[styles.titleBar]}>
						<div style={[styles.windowControls]}></div>
						<div style={[styles.title,styles.title[titleMode]]}>
							<div style={[styles.title.label, styles.title.label[titleMode]]}>
								{titleNode}
							</div>
							
							{subTitleNode && <div style={[styles.title.subLabel,styles.title.subLabel[titleMode]]}>
								{subTitleNode}
							</div>}
						</div>
						{/* TITLE BAR ACTION CONTROLS */}
						{!titleActionNodes ? React.DOM.noscript() : Array.isArray(titleActionNodes) ?
						<div style={[styles.titleActions]}>
							{!Array.isArray(titleActionNodes) ?
								titleActionNodes :
								titleActionNodes.map((action,index) => <div style={styles.titleAction} key={index}>{action}</div>)}
						</div> :
							titleActionNodes
						}
					</div>
					
					
					<form style={[
					      	styles.body,
					      	styles.form,
					      	saving && {
						        opacity: 0,
						        pointerEvents: 'none'
						      }
					      ]}>
						{this.props.children}
					</form>
					
					{actionNodes &&
						<div style={[styles.actions]}>
							{actionNodes}
						</div>
					}
					{/* Saving progress indicator */}
					{saving && <div style={[styles.savingIndicator,saving && {opacity: 1}]}>
						<CircularProgress
							color={theme.progressIndicatorColor}
							size={50}/>
					</div>}
				</div>
			
			
			{/*</Dialog>*/}
			{/*</MuiThemeProvider>*/}
		</div>
	}
	
}