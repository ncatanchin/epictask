
import {RepoKey} from '../../../shared/Constants'
/**
 * Displays a list of repos
 */
const log = getLogger(__filename)

import * as React from 'react'
import {TRepoState,RepoActionFactory} from 'app/actions'
import {MIcon} from 'app/components'
import {AvailableRepo,Repo} from 'shared'
import {connect} from 'react-redux'
import {makeStyle,rem,FlexRowCenter,FlexColumn,FlexAuto,FlexScale,FlexAlignStart,FillWidth,Ellipsis,FlexColumnCenter,makeTransition} from 'app/themes'

const repoActions = new RepoActionFactory()

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

		this.state = {hover:false}
	}

	onAvailRepoClicked = (availRepo:AvailableRepo,availRepoIndex:number,isSelected:boolean,event:any) => {
		if (event.metaKey) {
			repoActions.setRepoSelected(availRepo,!isSelected)
		} else {
			repoActions.setRepoEnabled(availRepo, !availRepo.enabled)
		}
	}

	render() {

		const {availableRepos,repos,theme,selectedRepos = []} = this.props

		const themeStyles = theme.repoPanel

		return <ul {...this.props} style={styles.list} className={this.props.className}>
			{availableRepos && availableRepos.map((availRepo,availRepoIndex) => {
				const repo = _.find(repos,(it) => it.id === availRepo.repoId)
				if (!repo)
					return

				const isSelected = !!selectedRepos.find(selectedAvailRepo => selectedAvailRepo.id === availRepo.id)
				const isEnabled = availRepo.enabled

				return <li data-selected={isSelected}
				           data-enabled={isEnabled}
				           key={repo.id}
				           onMouseEnter={() => this.setState({hover:true})}
				           onMouseLeave={() => this.setState({hover:false})}
				           onClick={(event) => this.onAvailRepoClicked(availRepo,availRepoIndex,isSelected,event)}
				           style={makeStyle(
				                styles.item,
				                themeStyles.list.item,
				                isEnabled && styles.itemEnabled,
				                isEnabled && themeStyles.list.itemEnabled,
				                this.state.hover && themeStyles.list.itemHover,
				                isSelected && themeStyles.list.itemSelected,
				                (isSelected && this.state.hover) && themeStyles.list.itemSelectedHover
			                )}>
					<MIcon extraStyle={styles.itemIcon}>{isEnabled ? 'check_circle' : 'radio_button_unchecked'}</MIcon>
					<div style={styles.itemLabel}>{repo.name}</div>
				</li>
			})}
		</ul>
	}


}