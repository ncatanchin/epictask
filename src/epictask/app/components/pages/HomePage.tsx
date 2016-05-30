import * as React from 'react'
import {List,ListItem,Paper} from 'material-ui'

const log = getLogger(__filename)

import {RepoActionFactory,RepoState,TRepoState} from 'epictask/app/actions'
import {getStore} from '../../store'
import {Page} from '../common'
const {Flexbox,FlexItem} = require('flexbox-react')

const styles = require('./HomePage.css')
const repoActions = new RepoActionFactory()

/**
 * The root container for the app
 */
export class HomePage extends React.Component<any,TRepoState> {

	static getInitialState() {
		return repoActions.state
	}

	// Unsubscribe ref
	private observer

	constructor(props, context) {
		super(props, context)
	}

	componentDidMount() {
		this.observer = getStore().observe(repoActions.leaf(),() => {
			this.setState(repoActions.state)
		})
	}

	componentWillUnmount() {
		if (this.observer) {
			this.observer()
			this.observer = null
		}
	}

	render() {
		const repos = repoActions.state.repos || []

		return (
			<Page styleName="homePage">
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				{/*Repo list*/}
				<FlexItem flexGrow={1} flexShrink={1} flexBasis="0px">

					<List>
						{repos.map(repo => {
							return <ListItem key={repo.id}>
								<Paper>{repo.name}</Paper>
							</ListItem>
						})}
					</List>

				</FlexItem>


			</Page>
		)
	}
}


