import * as React from 'react'
import {Dialog,AutoComplete,FlatButton} from 'material-ui'


import {RepoPanel,IssuesPanel,IssueDetailPanel} from 'components'
import {Repo} from 'shared/models'
import {Page} from './Page'
import {AppActionFactory} from '../../../shared/actions/AppActionFactory'
import {AppStateType} from '../../../shared/AppStateType'
import {connect} from 'react-redux'
import * as SplitPane from 'react-split-pane'
import {Icon,PureRender} from '../common'
import {RepoKey} from '../../../shared/Constants'

const Resizable = require('react-component-resizable')

const log = getLogger(__filename)
const appActions = new AppActionFactory()


const styles = {
	bodyWrapper: makeStyle(FlexScale,Fill)
}

interface IHomeProps {

}

/**
 * Map theme into props - very shorthand
 * @param state
 */
const mapStateToProps = (state) => ({theme: getTheme()})

/**
 * The root container for the app
 */
@connect(mapStateToProps)
@PureRender
export class HomePage extends React.Component<IHomeProps,any> {

	constructor(props, context) {
		super(props, context)
		this.state = this.getNewState()
	}

	getNewState() {
		return {width:window.innerWidth}
	}

	onResize = () => {
		this.setState(this.getNewState())
	}

	handleClose = () => {
		appActions.setStateType(AppStateType.Home)
	}

	render() {
		//const repos = repoActions.state.repos || []

		const addRepoActions = [
			<FlatButton
				label="Cancel"
				primary={true}
				onTouchTap={this.handleClose}
			/>,
			<FlatButton
				label="Submit"
				primary={true}
				disabled={true}
				onTouchTap={this.handleClose}
			/>,
		]



		return (
			<Page>
				<Resizable onResize={this.onResize} style={styles.bodyWrapper}>
					<SplitPane split="vertical" minSize={200} maxSize={this.state.width / 2}>
						<RepoPanel />
						<IssuesPanel />
					</SplitPane>
				</Resizable>
			</Page>
		)
	}
}
