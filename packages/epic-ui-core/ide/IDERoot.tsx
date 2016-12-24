import { DragDropContext } from "react-dnd"
import HTML5Backend from "react-dnd-html5-backend"
import { createStructuredSelector } from "reselect"
import { connect } from "react-redux"
import { PureRender, ToastMessages, Page, SheetRoot } from "epic-ui-components"
import { IDETabbedViewContainer } from './IDETabbedViewContainer'
import { ThemedStyles, makeLinearGradient, convertRem, IThemedAttributes } from "epic-styles"
import { getValue, guard } from "epic-global"
import { ToolPanelComponent as ToolPanel } from "./ToolPanel"
import { ToolDragLayer } from "./ToolDragLayer"
import {
	toolPanelsSelector,
	toolDraggingSelector,
	sheetURISelector,
	availableRepoCountSelector,
	modalWindowOpenSelector
} from "epic-typedux/selectors"
// TODO: Move to IDEView
import Header from "./Header"
import { StatusBar } from "../status-bar"
import { rem, colorAlpha, FillWindow, FlexColumn, FlexRowCenter, FlexScale, PositionRelative } from "epic-styles/styles"


const
	SplitPane = require('react-split-pane'),
	Resizable = require('react-component-resizable'),
	log = getLogger(__filename)


const
	transition = makeTransition([ 'width', 'minWidth', 'maxWidth', 'flex', 'flexBasis', 'flexShrink', 'flexGrow' ]),
	paneTransition = makeTransition([ 'min-width', 'max-width', 'min-height', 'max-height' ])


const baseStyles = (topStyles, theme, palette) => {
	
	const
		{ primary, text, secondary, accent } = palette,
		viewWrapperBorder = `0.1rem solid ${colorAlpha(primary.hue2, 0.9)}`
	
	
	return {
		app: [ FillWindow, FlexColumn, {
			overflow: 'hidden'
		} ],
		
		header: [ makeTransition([ 'height', 'width', 'opacity' ]), FlexRowCenter, {} ],
		
		content: [ makeTransition([ 'height', 'width', 'opacity' ]), FlexScale, FlexColumn, PositionRelative, {} ],
		
		collapsed: [ {
			flexGrow: 0
		} ],
		
		blur: [ {
			WebkitFilter: "blur(0.2rem)", /* Chrome, Safari, Opera */
			filter: "blur(0.2rem)"
		} ],
		
		page: [],
		bodyWrapper: [ Styles.FlexScale, Styles.Fill ]
		
		
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
	unsubscribe?:() => any
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
	modalOpen: modalWindowOpenSelector
}))
@ThemedStyles(baseStyles, 'homePage')
@PureRender
export class IDERoot extends React.Component<IIDERootProps,IIDERootState> {
	
	
	/**
	 * On mount subscribe and update state
	 */
	componentWillMount() {
		this.setState({
			unsubscribe: EventHub.on(EventHub.ViewsChanged, () => this.updateState())
		}, this.updateState)
	}
	
	/**
	 * On new props update state
	 */
	componentWillReceiveProps = this.updateState
	
	/**
	 * On will unmount, unsub
	 */
	componentWillUnmount() {
		guard(this.state.unsubscribe)
	}
	
	/**
	 * Get new state
	 */
	private getNewState = (props = this.props) => ({
		width: window.innerWidth
	})
	
	/**
	 * Update state
	 */
	private updateState = (props = this.props) => this.setState(this.getNewState(props))
	
	
	render() {
		const
			{ theme, styles, palette, toolDragging, toolPanels } = this.props,
			{ accent } = palette,
			
			panelMinOpen = convertRem(20),
			
			
			getPanel = (location) => toolPanels.get(ToolPanelLocation[ location ]),
			getTools = (panel:IToolPanel) => !panel ? {} : panel.tools || {},
			toolCount = (panel:IToolPanel) => getValue(() => panel.toolIds.size, 0),
			
			panelMinDim = (panel:IToolPanel) => convertRem(theme.toolPanel[ panel.location ].minDim),
			panelMinSize = (panel:IToolPanel) => toolDragging ? panelMinDim(panel) : (!toolCount(panel)) ? 0 : panel.open ? panelMinOpen : panelMinDim(panel),
			panelMaxSize = (panel:IToolPanel) => toolDragging ? panelMinDim(panel) : (!toolCount(panel)) ? 0 : panel.open ? this.state.width / 2 : panelMinDim(panel),
			
			
			constraintNames = (panel:IToolPanel) => [ ToolPanelLocation.Popup, ToolPanelLocation.Bottom ].includes(panel.location) ?
				[ 'minHeight', 'maxHeight' ] : [ 'minWidth', 'maxWidth' ],
			
			makePanelConstraint = (panel:IToolPanel) => {
				const
					[ min, max ] = constraintNames(panel)
				
				return {
					[min]: panelMinSize(panel),
					[max]: panelMaxSize(panel)
				}
			}
		
		
		const
			// rightPanel = getPanel(ToolPanelLocation.Right),
			// leftPanel = getPanel(ToolPanelLocation.Left),
			bottomPanel = getPanel(ToolPanelLocation.Bottom),
			
			borderGradientColorCap = TinyColor(accent.hue2).setAlpha(0.2).toRgbString(),
			borderGradientColor = TinyColor(accent.hue2).setAlpha(0.7).toRgbString(),
			
			splitPaneStyles = createStyles({
				' > .Pane': [ paneTransition ],
				' > .Resizer.vertical::after': [ {
					background: makeLinearGradient('to right', borderGradientColorCap, borderGradientColor, borderGradientColorCap),
					
				} ],
				' > .Resizer.horizontal::after': [ {
					background: makeLinearGradient(borderGradientColorCap, borderGradientColor, borderGradientColorCap),
				} ],
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
			
			<Radium.Style scopeSelector=".toolPanelSplitPane"
			              rules={{
			              	'> .Pane1': Styles.OverflowHidden
			              }}
			/>
			
			{/* HEADER */}
			<Header/>
			
			<div style={[styles.content]}>
				<div style={styles.bodyWrapper}>
					
					{/* TOOL PANEL BOTTOM */}
					<SplitPane
						className="toolPanelSplitPane"
						split="horizontal"
						primary="second"
						minSize={panelMinSize(bottomPanel)}
						maxSize={panelMaxSize(bottomPanel)}
						pane2Style={makePanelConstraint(bottomPanel)}>
						
						
						<IDETabbedViewContainer />
						
						<ToolPanel location={ToolPanelLocation.Bottom}/>
					
					</SplitPane>
				</div>
			
			</div>
			
			{/* TOASTER */}
			<ToastMessages/>
			
			{/*/!* STATUS BAR *!/*/}
			{/*<StatusBar />*/}
			
			
			{/* SHEET ROOT */}
			<SheetRoot />
			
			<ToolDragLayer />
		
		
		</Page>
	}
}
