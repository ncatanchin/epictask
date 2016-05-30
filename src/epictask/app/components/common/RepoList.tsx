/**
 * Displays a list of repos
 */
const log = getLogger(__filename)

import * as React from 'react'
import {TRepoState} from '../../actions/repo/RepoState'
import {List,ListItem} from 'material-ui'
import {Repo} from 'epictask/shared'

export interface IRepoListProps {
	repos?:Repo[]
	repo?:Repo
	styleName?:string
	className?:string
}

/**
 * A list of repos
 */
export class RepoList extends React.Component<IRepoListProps,any> {


	constructor(props) {
		super(props)
	}

	componentWillMount() {
	}

	componentDidMount() {
	}

	componentWillUnmount() {
	}

	render() {

		const {repos,repo} = this.props

		return <List styleName={this.props.styleName} className={this.props.className}>
			{repos && repos.map(it => {
				return <ListItem selected={repo && repo.id === it.id} key={it.id}>
					{it.name}
				</ListItem>
			})}
		</List>
	}


}