import * as React from 'react'

import * as Radium from 'radium'
import {createStructuredSelector} from 'reselect'
import {RepoPanel,IssuesPanel} from 'components'
import {Page} from './Page'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {AppStateType} from 'shared/AppStateType'
import {connect} from 'react-redux'
import * as SplitPane from 'react-split-pane'
import {PureRender} from 'components/common'
import {Themed} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'

const Resizable = require('react-component-resizable')

const log = getLogger(__filename)
const appActions = new AppActionFactory()

const transition = makeTransition(['width','minWidth','maxWidth','flex','flexBasis','flexShrink','flexGrow'])

const styles:any = createStyles({

	page:[{
		'.homePageSplitPane > .Pane1,': [transition],
		'.homePageSplitPane > .Pane2,': [transition],
	}],
	bodyWrapper: makeStyle(FlexScale,Fill)


})

interface IHomeProps {
	repoPanelOpen?:boolean
}

interface IHomeState {
	width?:number
}

/**
 * Map theme into props - very shorthand
 * @param state
 */
const mapStateToProps = createStructuredSelector({
	repoPanelOpen: (state) => uiStateSelector(state).repoPanelOpen
},createDeepEqualSelector)

/**
 * The root container for the app
 */
@connect(mapStateToProps)
@Themed
@PureRender
export class HomePage extends React.Component<IHomeProps,IHomeState> {

	componentWillMount = () => this.setState(this.getNewState())

	getNewState = () => ({width:window.innerWidth})

	updateState = () => this.setState(this.getNewState())

	render() {
		const {repoPanelOpen} = this.props

		return <Page onResize={this.updateState} id="homePage">
			<Radium.Style scopeSelector="#homePage"
			              rules={styles.page}
			/>
			<div style={styles.bodyWrapper}>
				<SplitPane className="homePageSplitPane"
							split="vertical"
				           minSize={repoPanelOpen ? 200 : 20}
				           maxSize={repoPanelOpen ? this.state.width / 2 : 20}  >
					<RepoPanel />
					<IssuesPanel />
				</SplitPane>
			</div>
		</Page>
	}
}
