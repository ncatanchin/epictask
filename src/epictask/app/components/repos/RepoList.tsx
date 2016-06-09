
import {RepoKey} from '../../../shared/Constants'
/**
 * Displays a list of repos
 */
const log = getLogger(__filename)

import * as React from 'react'
import {TRepoState,RepoActionFactory} from 'app/actions/repo'
import {Icon,Renderers} from 'app/components'
import {AvailableRepo,Repo} from 'shared'
import {connect} from 'react-redux'
import {makeStyle,rem,FlexRowCenter,FlexColumn,FlexAuto,FlexScale,FlexAlignStart,FillWidth,Ellipsis,FlexColumnCenter,makeTransition} from 'app/themes'



export interface IRepoListProps {
	availableRepos?:AvailableRepo[]
	repos?:Repo[]
	selectedRepo?:Repo
	styleName?:string
	className?:string
	style?:any
	selectedRepos?:AvailableRepo[]
	theme?: any
}

const styles = {
	list: makeStyle(FlexColumn,FlexAlignStart,FillWidth,{
		margin: 0,
		padding: 0,
		border: 0
	}),

	item: makeStyle(makeTransition(null,0.15),FlexRowCenter,FlexAuto,FillWidth,{
		listStyle: 'none',
		margin: 0,
		padding: '0.5rem 0.5rem',
		border: 0,
		cursor: 'pointer'

	}),

	itemEnabled: {

	},

	itemIcon: makeStyle(FlexAuto,{
		padding: rem(0.2),
		fontSize: rem(1.1)
	}),

	itemLabel: makeStyle(Ellipsis,FlexScale,{
		padding: '0.2rem 0.2rem 0.2rem 1rem',
		fontSize: rem(1.2),
		fontWeight: 100
	})
}

function mapToProps(state) {
	const repoState = state.get(RepoKey) as TRepoState

	return {
		selectedRepos: repoState.selectedRepos,
		theme: getTheme()
	}
}


/**
 * A list of repos
 */
@connect(mapToProps)
export class RepoList extends React.Component<IRepoListProps,any> {


	constructor(props) {
		super(props)

		this.state = {hoverId:null}
	}

	onAvailRepoClicked = (availRepo:AvailableRepo,availRepoIndex:number,isSelected:boolean,event:any) => {
		const repoActions = new RepoActionFactory()
		if (event.metaKey) {
			repoActions.setRepoSelected(availRepo,!isSelected)
		} else {
			if (this.props.selectedRepos.length) {
				repoActions.clearSelectedRepos()
			}

			repoActions.setRepoEnabled(availRepo, !availRepo.enabled)
		}
	}

	render() {
		const repoActions = new RepoActionFactory()
		const {availableRepos,repos,theme,selectedRepos = []} = this.props

		const themeStyles = theme.repoPanel

		return <ul {...this.props} style={styles.list} className={this.props.className}>
			{availableRepos && availableRepos.map((availRepo,availRepoIndex) => {
				const repo = _.find(repos,(it) => it.id === availRepo.repoId)
				if (!repo)
					return

				const isSelected = !!selectedRepos.find(selectedAvailRepo => selectedAvailRepo.id === availRepo.id)
				const isEnabled = availRepo.enabled
				const isHovering = this.state.hoverId === availRepo.id
				return <li data-selected={isSelected}
				           data-enabled={isEnabled}
				           key={availRepo.id}
				           onMouseEnter={() => this.setState({hoverId:availRepo.id})}
				           onMouseLeave={() => this.setState({hoverId:null})}
				           onClick={(event) => this.onAvailRepoClicked(availRepo,availRepoIndex,isSelected,event)}
				           style={makeStyle(
				                styles.item,
				                themeStyles.list.item,
				                isEnabled && styles.itemEnabled,
				                isEnabled && themeStyles.list.itemEnabled,
				                isHovering && themeStyles.list.itemHover,
				                isSelected && themeStyles.list.itemSelected,
				                (isSelected && isHovering) && themeStyles.list.itemSelectedHover
			                )}>
					<Icon extraStyle={styles.itemIcon}>{isEnabled ? 'check_circle' : 'radio_button_unchecked'}</Icon>
					<div style={styles.itemLabel}>{Renderers.repoName(repo)}</div>
					<Icon extraStyle={{}} onClick={(e) => {
						e.stopPropagation()
						e.preventDefault()
						repoActions.syncIssues(availRepo)
					}}>sync</Icon>
				</li>
			})}
		</ul>
	}


}