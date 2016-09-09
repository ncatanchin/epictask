import * as React from 'react'

import * as Radium from 'radium'
import {List} from 'immutable'
import {createStructuredSelector} from 'reselect'
import {IssuesPanel} from 'ui/components/issues'
import {Page} from './Page'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {connect} from 'react-redux'
import * as SplitPane from 'react-split-pane'
import {PureRender} from 'ui/components/common'
import {Themed, ThemedNoRadium, ThemedStyles} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {ToolPanelLocation, IToolPanel} from "shared/tools/ToolTypes"
import {ToolPanelComponent as ToolPanel} from "ui/components/ToolPanel"
import {makeLinearGradient, Transparent} from "shared/themes"


const
	Resizable = require('react-component-resizable'),

	log = getLogger(__filename)


const
	transition = makeTransition(['width','minWidth','maxWidth','flex','flexBasis','flexShrink','flexGrow']),
	paneTransition = makeTransition(['min-width','max-width','min-height','max-height'])

const baseStyles:any = createStyles({

	page:[],
	bodyWrapper: [FlexScale,Fill],
	viewWrapper:[FlexScale,Fill,{
		borderStyle: 'solid',
		borderWidth: rem(0.1)
	}]

})

interface IHomeProps {
	theme?:any
	styles?:any
	toolPanels:Map<string,IToolPanel>
}

interface IHomeState {
	width?:number
}


/**
 * The root container for the app
 */
@connect(createStructuredSelector({
	toolPanels: (state) => _.nilListFilter(uiStateSelector(state).toolPanels as any)
}, createDeepEqualSelector))
@ThemedStyles(baseStyles,'homePage')
//@PureRender
export class HomePage extends React.Component<IHomeProps,IHomeState> {
	
	appActions = Container.get(AppActionFactory)
	
	componentWillMount = () => this.setState(this.getNewState())

	getNewState = () => ({width:window.innerWidth})

	updateState = () => this.setState(this.getNewState())

	render() {
		const
			{theme,styles,toolPanels} = this.props,
			{palette} = theme,
			{accent} = palette,
			getPanel = (location) => toolPanels.get(ToolPanelLocation[location]),
			getTools = (panel:IToolPanel) => !panel ? {} : panel.tools || {},
			toolCount = (panel:IToolPanel) => Object.keys(getTools(panel)).length,
			rightPanel = getPanel(ToolPanelLocation.Right),
			leftPanel = getPanel(ToolPanelLocation.Left),
			bottomPanel = getPanel(ToolPanelLocation.Bottom),
			[panelMinOpen] = [convertRem(20)],
			
			panelMinDim = (panel:IToolPanel) => convertRem(theme.toolPanel[panel.location].minDim),
			panelMinSize = (panel:IToolPanel) => !toolCount(panel) ? 0 : panel.open ? panelMinOpen : panelMinDim(panel),
			panelMaxSize = (panel:IToolPanel) => !toolCount(panel) ? 0 : panel.open ? this.state.width / 2 : panelMinDim(panel),
			constraintNames = (panel:IToolPanel) => [ToolPanelLocation.Popup,ToolPanelLocation.Bottom].includes(panel.location) ?
				['minHeight','maxHeight'] : ['minWidth','maxWidth'],
			makePanelConstraint = (panel:IToolPanel) => {
				const [min,max] = constraintNames(panel)
				return {
					[min]: panelMinSize(panel),
					[max]: panelMaxSize(panel)
				}
			},
			borderGradientColorCap = TinyColor(accent.hue2).setAlpha(0.2).toRgbString(),
			borderGradientColor = TinyColor(accent.hue2).setAlpha(0.7).toRgbString()
		
			
		return <Page onResize={this.updateState} id="homePage">
			<Radium.Style scopeSelector=".SplitPane"
			              rules={createStyles({
														' > .Pane': [paneTransition],
														' > .Resizer.vertical::after': [{
															background: makeLinearGradient('to right',borderGradientColorCap,borderGradientColor,borderGradientColorCap),
															
														}],
														' > .Resizer.horizontal::after': [{
															background: makeLinearGradient(borderGradientColorCap,borderGradientColor,borderGradientColorCap),
														}],
														
														
						              })}
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
