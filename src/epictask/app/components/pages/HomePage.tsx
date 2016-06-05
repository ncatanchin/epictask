import * as React from 'react'
import {Dialog,AutoComplete,FlatButton} from 'material-ui'

const log = getLogger(__filename)
import {RepoActionFactory,AuthActionFactory,TRepoState,TAuthState} from 'epictask/app/actions'
import {RepoPanel,IssuesPanel,IssueDetailPanel} from 'components'
import {Repo} from 'epictask/shared'
import {getStore} from '../../store'
import {Page} from '../common'
import {AppActionFactory} from 'app/actions/AppActionFactory'
import {AppStateType} from 'shared/AppStateType'
import {connect} from 'react-redux'
import * as SplitPane from 'react-split-pane'
import {MIcon} from '../common'

const Resizable = require('react-component-resizable')

const styles = require('./HomePage.css')
const repoActions = new RepoActionFactory()
const authActions = new AuthActionFactory()
const appActions = new AppActionFactory()

interface IHomeProps {
	repo?:Repo
	repos?:Repo[]
	addRepoDialog?:boolean

}

function mapToProps(state) {
	const repoState = repoActions.state

	return {
		repo: repoState.repo,
		repos: repoState.repos,
		addRepoDialog: appActions.state.stateType === AppStateType.RepoAdd
	}
}

/**
 * The root container for the app
 */
@connect(mapToProps)
@CSSModules(styles)
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

		const repos = this.props.repos || []

		const bodyContent = (repos.length) ?
			<Resizable onResize={this.onResize} className={styles.bodyWrapper}>
				<SplitPane split="vertical" minSize={200} maxSize={this.state.width / 2} className={styles.splitter}>
					<RepoPanel />
					<IssuesPanel />
				</SplitPane>
			</Resizable>
		:
			<MIcon onClick={() => appActions.setStateType(AppStateType.RepoAdd)}>add</MIcon>


		return (
			<Page>
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				{/*Repo list*/}


				{/* If there are no repos then show an add button */}
				{bodyContent}

				<Dialog
					title="add a repo..."
					modal={true}
					open={this.props.addRepoDialog}
				    actions={addRepoActions}
				>
					Add repo here
				</Dialog>
			</Page>
		)
	}
}