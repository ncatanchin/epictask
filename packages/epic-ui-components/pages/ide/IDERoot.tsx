import { DragDropContext } from "react-dnd"
import HTML5Backend from "react-dnd-html5-backend"
import { createStructuredSelector } from "reselect"
import { connect } from "react-redux"
import { PureRender,ToastMessages,Page } from "epic-ui-components/common"
import { ThemedStyles, makeLinearGradient, convertRem, IThemedAttributes } from "epic-styles"
import { createDeepEqualSelector, ToolPanelLocation, IToolPanel, getValue } from "epic-global"
import { ToolPanelComponent as ToolPanel } from "./ToolPanel"
import { ToolDragLayer } from "./ToolDragLayer"
import {
	toolPanelsSelector,
	toolDraggingSelector,
	sheetURISelector,
	availableRepoCountSelector, modalWindowOpenSelector
} from "epic-typedux/selectors"

// TODO: Move to IDEView
import { IssuesPanel } from "epic-ui-components/pages/issues-panel/IssuesPanel"
import { Header } from "epic-ui-components/pages/ide/Header"
import { StatusBar } from "epic-ui-components/status-bar"
import { SheetRoot } from "epic-ui-components/layout/sheet"
import { rem, colorAlpha, FillWindow, FlexColumn, FlexRowCenter, FlexScale, PositionRelative } from "epic-styles/styles"
import { ViewContainer } from "epic-ui-components/pages/ide/ViewContainer"
import { getUIActions } from "epic-typedux/provider/ActionFactoryProvider"


const
	SplitPane = require('react-split-pane'),
	Resizable = require('react-component-resizable'),
	log = getLogger(__filename)


const
	transition = makeTransition(['width','minWidth','maxWidth','flex','flexBasis','flexShrink','flexGrow']),
	paneTransition = makeTransition(['min-width','max-width','min-height','max-height'])

const baseStyles = (topStyles,theme,palette) => {
	
	const
		{primary,text,secondary,accent} = palette
	
	
	return {
		app: [ FillWindow, FlexColumn, {
			overflow: 'hidden'
		} ],
		
		header: [ makeTransition([ 'height', 'width', 'opacity' ]), FlexRowCenter, {} ],
		
		content: [ makeTransition([ 'height', 'width', 'opacity' ]), FlexScale,FlexColumn, PositionRelative, {
			
		} ],
		
		collapsed: [ {
			flexGrow: 0
		} ],
		
		blur: [ {
			WebkitFilter: "blur(0.2rem)", /* Chrome, Safari, Opera */
			filter: "blur(0.2rem)"
		} ],
		
		page: [],
		bodyWrapper: [ FlexScale, Fill ],
		viewWrapper: [ FlexScale, Fill, {
			borderStyle: 'solid',
			borderWidth: rem(0.1),
			borderColor: colorAlpha(primary.hue2,0.9)
		} ]
		
	}
}

export interface IIDERootProps extends IThemedAttributes {
	toolPanels:Map<string,IToolPanel>
	toolDragging:boolean
	hasAvailableRepos?:boolean
	modalOpen?:boolean
	sheetURI?:string
}

export interface IIDERootState {
	width?:number
}


/**
 * The root container for the app
 */
@(DragDropContext as any)(HTML5Backend)
@connect(createStructuredSelector({
	hasAvailableRepos: availableRepoCountSelector,
	sheetURI: sheetURISelector,
	toolPanels: toolPanelsSelector,
	toolDragging: toolDraggingSelector,
	modalOpen: modalWindowOpenSelector,
},createDeepEqualSelector))
@ThemedStyles(baseStyles,'homePage')
@PureRender
export class IDERoot extends React.Component<IIDERootProps,IIDERootState> {
	
	
	
	componentWillMount = () => {
		
		// MAKE SURE WE HAVE AT LEAST 1 VIEW
		getUIActions().ensureDefaultView()
		
		this.setState(this.getNewState())
	}
	
	/**
	 * Get new state
	 */
	getNewState = () => ({width:window.innerWidth})
	
	/**
	 * Update state
	 */
	updateState = () => this.setState(this.getNewState())

	
	render() {
		const
			{theme,styles,toolDragging,toolPanels} = this.props,
			{palette} = theme,
			{accent} = palette,
			
			panelMinOpen = convertRem(20),
			
			
			getPanel = (location) => toolPanels.get(ToolPanelLocation[location]),
			getTools = (panel:IToolPanel) => !panel ? {} : panel.tools || {},
			toolCount = (panel:IToolPanel) => getValue(() => panel.toolIds.length,0),
			
			panelMinDim = (panel:IToolPanel) => convertRem(theme.toolPanel[panel.location].minDim),
			panelMinSize = (panel:IToolPanel) => toolDragging ? panelMinDim(panel) : (!toolCount(panel)) ? 0 : panel.open ? panelMinOpen : panelMinDim(panel),
			panelMaxSize = (panel:IToolPanel) => toolDragging ? panelMinDim(panel) : (!toolCount(panel)) ? 0 : panel.open ? this.state.width / 2 : panelMinDim(panel),
			
			
			constraintNames = (panel:IToolPanel) => [ToolPanelLocation.Popup,ToolPanelLocation.Bottom].includes(panel.location) ?
				['minHeight','maxHeight'] : ['minWidth','maxWidth'],
			
			makePanelConstraint = (panel:IToolPanel) => {
				const
					[min,max] = constraintNames(panel)
				
				return {
					[min]: panelMinSize(panel),
					[max]: panelMaxSize(panel)
				}
			}
			
			
		const
			rightPanel = getPanel(ToolPanelLocation.Right),
			leftPanel = getPanel(ToolPanelLocation.Left),
			bottomPanel = getPanel(ToolPanelLocation.Bottom),
			
			borderGradientColorCap = TinyColor(accent.hue2).setAlpha(0.2).toRgbString(),
			borderGradientColor = TinyColor(accent.hue2).setAlpha(0.7).toRgbString(),
			
			splitPaneStyles = createStyles({
				' > .Pane': [paneTransition],
				' > .Resizer.vertical::after': [{
					background: makeLinearGradient('to right',borderGradientColorCap,borderGradientColor,borderGradientColorCap),
					
				}],
				' > .Resizer.horizontal::after': [{
					background: makeLinearGradient(borderGradientColorCap,borderGradientColor,borderGradientColorCap),
				}],
			})
		
			
		return <Page
			onResize={this.updateState}
			className='root-content'
		  id="homePage"
		  style={makeStyle(styles.app)}
		>
			
			<Radium.Style scopeSelector=".SplitPane"
			              rules={splitPaneStyles}
			/>
			
			{/* HEADER */}
			<Header/>
			
			
			<div style={[styles.content]}>
			
				<div style={styles.bodyWrapper}>
					{/* Tool Panel bottom Split */}
					<SplitPane className="toolPanelSplitPane"
					           split="horizontal"
					           primary="second"
					           minSize={panelMinSize(bottomPanel)}
					           maxSize={panelMaxSize(bottomPanel)}
					           pane2Style={makePanelConstraint(bottomPanel)}>
						
						{/* Tool Panel Left Split*/}
						<SplitPane className="toolPanelSplitPane"
						           split="vertical"
						           minSize={panelMinSize(leftPanel)}
						           maxSize={panelMaxSize(leftPanel)}
						           pane1Style={makePanelConstraint(leftPanel)}>
							
							<ToolPanel location={ToolPanelLocation.Left}/>
							
							{/* PRIMARY CONTENT + Tool Panel Right Split */}
							<SplitPane className="toolPanelSplitPane"
							           split="vertical"
							           primary="second"
							           minSize={panelMinSize(rightPanel)}
							           maxSize={panelMaxSize(rightPanel)}
							           pane2Style={makePanelConstraint(rightPanel)}>
								<div style={styles.viewWrapper}>
									<ViewContainer />
								</div>
								<ToolPanel location={ToolPanelLocation.Right}/>
							</SplitPane>
						</SplitPane>
						
						<ToolPanel location={ToolPanelLocation.Bottom}/>
					</SplitPane>
				</div>
			
			</div>
			
			{/* TOASTER */}
			<ToastMessages/>
			
			{/* STATUS BAR */}
			<StatusBar />
		
			
			
			{/* SHEET ROOT */}
			<SheetRoot />
			<ToolDragLayer />
				
				
		</Page>
	}
}
