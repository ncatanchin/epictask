import * as React from 'react'

import * as Radium from 'radium'
import {List} from 'immutable'
import {createStructuredSelector} from 'reselect'
import {RepoPanel,IssuesPanel} from 'components'
import {Page} from './Page'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {connect} from 'react-redux'
import * as SplitPane from 'react-split-pane'
import {PureRender} from 'components/common'
import {Themed} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {ToolPanelLocation, IToolPanel} from "shared/tools/ToolTypes"
import {ToolPanel} from "ui/components/ToolPanel"

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
	toolPanels:List<IToolPanel>
}

interface IHomeState {
	width?:number
}

/**
 * Map theme into props - very shorthand
 * @param state
 */
const mapStateToProps = createStructuredSelector({
	toolPanelStates: (state) => uiStateSelector(state).toolPanels
},createDeepEqualSelector)

/**
 * The root container for the app
 */
@connect(mapStateToProps)
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
			getPanel = (location) => toolPanels.find(it => it.location === location) || {} as IToolPanel,
			rightPanel = getPanel(ToolPanelLocation.Right),
			leftPanel = getPanel(ToolPanelLocation.Left),
			bottomPanel = getPanel(ToolPanelLocation.Bottom),
			[panelMinOpen,panelMinClosed] = [convertRem(20), convertRem(2)],
			
			panelMinSize = (panel:IToolPanel) => panel.open ? panelMinOpen : panelMinClosed,
			panelMaxSize = (panel:IToolPanel) => panel.open ? this.state.width / 2 : panelMinClosed

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
					             minSize={panelMinSize(leftPanel)}
											 maxSize={panelMaxSize(leftPanel)}>
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
