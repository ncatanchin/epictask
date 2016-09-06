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
import {Themed} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {ToolPanelLocation, IToolPanel} from "shared/tools/ToolTypes"
import {ToolPanelComponent as ToolPanel} from "ui/components/ToolPanel"


const
	Resizable = require('react-component-resizable'),

	log = getLogger(__filename)


const transition = makeTransition(['width','minWidth','maxWidth','flex','flexBasis','flexShrink','flexGrow'])

const styles:any = createStyles({

	page:[{
		'.toolPanelSplitPane > .Pane1,': [transition],
		'.toolPanelSplitPane > .Pane2,': [transition],
	}],
	bodyWrapper: makeStyle(FlexScale,Fill)


})

interface IHomeProps {
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
@Themed
@PureRender
export class HomePage extends React.Component<IHomeProps,IHomeState> {
	
	appActions = Container.get(AppActionFactory)
	
	componentWillMount = () => this.setState(this.getNewState())

	getNewState = () => ({width:window.innerWidth})

	updateState = () => this.setState(this.getNewState())

	render() {
		const
			{toolPanels} = this.props,
			getPanel = (location) => toolPanels.get(ToolPanelLocation[location]),
			getTools = (panel:IToolPanel) => !panel ? {} : panel.tools || {},
			toolCount = (panel:IToolPanel) => Object.keys(getTools(panel)).length,
			rightPanel = getPanel(ToolPanelLocation.Right),
			leftPanel = getPanel(ToolPanelLocation.Left),
			bottomPanel = getPanel(ToolPanelLocation.Bottom),
			[panelMinOpen,panelMinClosed] = [convertRem(20), convertRem(2)],
			
			panelMinSize = (panel:IToolPanel) => !toolCount(panel) ? 0 : panel.open ? panelMinOpen : panelMinClosed,
			panelMaxSize = (panel:IToolPanel) => !toolCount(panel) ? 0 : panel.open ? this.state.width / 2 : panelMinClosed

		return <Page onResize={this.updateState} id="homePage">
			<Radium.Style scopeSelector="#homePage"
			              rules={styles.page}
			/>
			<div style={styles.bodyWrapper}>
				{/* Tool Panel bottom Split */}
				<SplitPane className="toolPanelSplitPane"
				           split="horizontal"
				           primary="second"
				           minSize={panelMinSize(bottomPanel)}
				           maxSize={panelMaxSize(bottomPanel)}>
					
					{/* Tool Panel Left Split*/}
					<SplitPane className="toolPanelSplitPane"
					           split="vertical"
					           minSize={panelMinSize(leftPanel)}
					           maxSize={panelMaxSize(leftPanel)}>
						<ToolPanel location={ToolPanelLocation.Left}/>
						
						{/* PRIMARY CONTENT + Tool Panel Right Split */}
						<SplitPane className="toolPanelSplitPane"
						           split="vertical"
						           primary="second"
					             minSize={panelMinSize(rightPanel)}
											 maxSize={panelMaxSize(rightPanel)}>
							<IssuesPanel />
							<ToolPanel location={ToolPanelLocation.Right}/>
						</SplitPane>
					</SplitPane>
					
					<ToolPanel location={ToolPanelLocation.Bottom}/>
				</SplitPane>
			</div>
		</Page>
	}
}
