// Imports
import { ThemedStyles, makeWidthConstraint, makeHeightConstraint, colorAlpha, makeIcon, Themed } from "epic-styles"
import { WindowControls, FormButton, PureRender } from "../../common"
import * as React from "react"


// Constants
const
	log = getLogger(__filename),
	{Ellipsis,FlexColumn,FillWindow,PositionRelative,OverflowAuto,makeFlex, FillWidth, rem,makeFlexAlign,FillHeight, FlexRow,FlexScale, FlexRowCenter, makePaddingRem} = Styles

const baseStyles = (topStyles,theme,palette) => {
	const
		{text,accent,primary,secondary,background} = palette,
		
		actionStyle = makeStyle(makeHeightConstraint(rem(2.8)),{
			border: `1px solid ${primary.hue1}`,
			borderRadius: 3,
			backgroundColor: primary.hue2,
			color: text.primary
			
		})
	
	return {
		root: [ FillWindow, FlexColumn, {
			minHeight: 500,
			backgroundColor: background
		} ],
		
		header: [ FlexRow, makeFlexAlign( 'center','flex-end'), makePaddingRem(0),FillWidth, makeHeightConstraint(Env.isMac ? rem(2.5) : theme.navBarHeight), {
			
			
			
			WebkitUserSelect: 'none',
			WebkitAppRegion: 'drag',
			
			hasActions: [makeHeightConstraint(Env.isMac ? rem(5.3) : rem(3))],
			
			// SPACER - push actions right
			spacer: [makeFlex(1,1,0)],
			
			empty: [!Env.isMac && makeHeightConstraint(0)],
			
			// ACTION NODES
			titleActions: [Styles.FlexAuto,FlexRow, makeFlexAlign( 'center','flex-end'),actionStyle],
			titleAction: [FillHeight],
			actions: [ FlexRow, makePaddingRem(0, 0,0,1), makeFlexAlign( 'flex-end','center'), actionStyle,{
			
			} ],
			
			subLabel: [Ellipsis,makeFlex(0,1,'auto'),{}],
			
			toolbar: [FlexRowCenter,FlexScale,PositionRelative,makePaddingRem(Env.isMac ? 1.8 : 0,1,0,1),{
				flexDirection: Env.isMac ? 'row' : 'row-reverse',
			}]
		}],
			
		// WINDOW CONTROLS ARE FAR LEFT
		//windowControls: [ makeWidthConstraint(rem(10)), {} ],
		
		// TITLE IS BETWEEN WINDOW CONTROLS AND TITLE ACTION NODES
		form: [ FlexScale, FlexColumn, FillWidth, PositionRelative, OverflowAuto, makePaddingRem(1,0,0,0),{
			backgroundColor: background,
			fontSize: themeFontSize(2),
			color: text.primary,
			
			row: [ {
				height: 72
			} ],
			
			
		} ],
		
		
		
		savingIndicator: [ PositionAbsolute, FlexColumnCenter, Fill, makeAbsolute(), {
			opacity: 0,
			pointerEvents: 'none'
		} ]
		
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
	return <FormButton
			onClick={cancelAction}
			key='cancelButton'
			hoverHighlight='warn'
			icon={makeIcon('material-icons','close')}
		/>
		
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
	return [
		createCancelButton(theme,palette,cancelAction),
		<FormButton
			onClick={saveAction}
		  key='saveButton'
		  icon={makeIcon('material-icons','save')}
		  />
			
	]
	
}

/**
 * IDialogRootProps
 */
export interface IDialogRootProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	title:string
	titleNode:React.ReactNode|string
	subTitleNode?:React.ReactNode|string
	titleMode?:'vertical'|'horizontal'
	saving?:boolean
	titleActionNodes?:any
	actionNodes?:any
	hideActions?:boolean
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
@ThemedStyles(baseStyles,'dialog')
@PureRender
export class DialogRoot extends React.Component<IDialogRootProps,IDialogRootState> {
	
	private updateTitle() {
		!Env.isMac && require('electron').remote.getCurrentWindow().setTitle(this.props.title)
	}
	
	componentWillMount() {
		this.updateTitle()
	}
	
	componentWillReceiveProps() {
		this.updateTitle()
	}
	
	
	render() {
		const
			{ titleNode,subTitleNode,actionNodes,titleActionNodes,saving,theme, styles,hideActions } = this.props,
			titleMode = this.props.titleMode || 'vertical'
		
		return <div style={styles.root}>
			{/*<MuiThemeProvider theme={theme}>*/}
			{/*<WindowControls />*/}
				<div style={[Styles.Fill,FlexColumn,FlexScale]}>
					<DialogHeader {...{
						styles: styles.header,
						titleMode,
						titleNode,
						subTitleNode,
						actionNodes,
						titleActionNodes
					}}/>
					
					
					{this.props.children}
					
					
					{actionNodes &&
						<div style={[styles.actions,hideActions && makeHeightConstraint(0)]}>
							{actionNodes}
						</div>
					}
				</div>
			
			
			{/*</Dialog>*/}
			{/*</MuiThemeProvider>*/}
		</div>
	}
	
}


@Themed
@PureRender
class DialogHeader extends React.Component<any,any> {
	
	render() {
		let
			{styles,theme,titleNode,subTitleNode,titleActionNodes,titleMode} = this.props
			
		styles = mergeStyles(styles,theme.header)
			
		return <div style={[styles,titleActionNodes && styles.hasActions, !titleActionNodes && !subTitleNode && styles.empty]}>
			{/* ONLY SHOW TOP TITLE ON MAC */}
			{Env.isMac && <div style={[styles.title]}>
				{titleNode}
			</div>}
			
			{/* TITLE BAR ACTION CONTROLS */}
			<div style={[styles.toolbar]}>
				
				{subTitleNode && <div style={[styles.subLabel,styles.subLabel[titleMode]]}>
					{subTitleNode}
				</div>}
				
				{titleActionNodes &&
					<div style={styles.spacer}/>
				}
				
				{titleActionNodes &&
				<div style={[styles.titleActions]}>
					{Array.isArray(titleActionNodes) ?
						titleActionNodes :
						titleActionNodes.map ?
							titleActionNodes.map((action,index) => <div style={styles.titleAction} key={index}>{action}</div>) :
						titleActionNodes
					
					}
				</div>
				}
				
			</div>
		</div>
	}
}