import * as React from 'react'

import * as Radium from 'radium'
import {createStructuredSelector} from 'reselect'
import {IssuesPanel} from 'ui/components/issues'
import {Page} from './Page'
import {AppActionFactory} from 'shared/actions/app/AppActionFactory'
import {connect} from 'react-redux'

import {PureRender} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {ToolPanelLocation, IToolPanel} from "shared/tools/ToolTypes"
import {ToolPanelComponent as ToolPanel} from "ui/components/ToolPanel"
import { makeLinearGradient, Transparent, convertRem } from "shared/themes/styles"
import { IThemedAttributes } from "shared/themes/ThemeDecorations"
import { toolPanelsSelector, toolDraggingSelector } from "shared/actions/ui/UISelectors"
import { getValue } from "shared/util"


const
	SplitPane = require('react-split-pane'),
	Resizable = require('react-component-resizable'),
	log = getLogger(__filename)


const
	transition = makeTransition(['width','minWidth','maxWidth','flex','flexBasis','flexShrink','flexGrow']),
	paneTransition = makeTransition(['min-width','max-width','min-height','max-height'])

const baseStyles = (topStyles,theme,palette) => ({

	page:[],
	bodyWrapper: [FlexScale,Fill],
	viewWrapper:[FlexScale,Fill,{
		borderStyle: 'solid',
		borderWidth: rem(0.1)
	}]

})

export interface IHomeProps extends IThemedAttributes {
	toolPanels:Map<string,IToolPanel>
	toolDragging:boolean
}

export interface IHomeState {
	width?:number
}


/**
 * The root container for the app
 */
@connect(createStructuredSelector({
	toolPanels: toolPanelsSelector,
	toolDragging: toolDraggingSelector
},createDeepEqualSelector))
@ThemedStyles(baseStyles,'homePage')
@PureRender
export class HomePage extends React.Component<IHomeProps,IHomeState> {
	
	
	
	componentWillMount = () => this.setState(this.getNewState())
	
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
		
			
		return <Page onResize={this.updateState} id="homePage">
			<Radium.Style scopeSelector=".SplitPane"
			              rules={splitPaneStyles}
			/>
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
								<IssuesPanel />
							</div>
							<ToolPanel location={ToolPanelLocation.Right}/>
						</SplitPane>
					</SplitPane>
					
					<ToolPanel location={ToolPanelLocation.Bottom}/>
				</SplitPane>
			</div>
		</Page>
	}
}
