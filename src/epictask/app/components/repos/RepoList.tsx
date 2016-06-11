
import {RepoKey, AppKey} from '../../../shared/Constants'
/**
 * Displays a list of repos
 */
const log = getLogger(__filename)

import * as React from 'react'
import {TRepoState} from 'app/actions/repo/RepoState'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {Icon,Renderers} from 'app/components'
import {AvailableRepo,Repo} from 'shared'
import {connect} from 'react-redux'
import {makeStyle,rem,FlexRowCenter,FlexColumn,FlexAuto,FlexScale,FlexAlignStart,FillWidth,Ellipsis,FlexColumnCenter,makeTransition} from 'app/themes'

const repoActions = new RepoActionFactory()

//region Props
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
//endregion

//region Styles
const styles = {
	list: makeStyle(FlexColumn,FlexScale,FlexAlignStart,FillWidth,{
		overflowY: 'auto',
		margin: 0,
		padding: 0,
		border: 0
	}),

	item: makeStyle(makeTransition(null,0.15),FlexRowCenter,FlexAuto,FillWidth,{
		listStyle: 'none',
		margin: 0,
		padding: '0.5rem 0.5rem',
		border: 0,
		cursor: 'pointer',
		alignItems: 'center',
		fontSize: themeFontSize(1.1)
	}),

	itemEnabled: {
		fontSize: themeFontSize(1.3)
	},

	itemIcon: makeStyle(FlexAuto,{
		padding: '0 0.2rem',
		fontSize: rem(1.3)
	}),

	itemLabel: makeStyle(FlexColumn,FlexScale,{
		padding: '0.2rem 0.2rem 0 0.5rem',
		justifyContent: 'center',
		// fontSize: themeFontSize(1.1),
		fontWeight: 100
	})
}
//endregion

function mapToProps(state) {
	const repoState = state.get(RepoKey)
	const appState = state.get(AppKey)
	return {
		repos: repoState.repos,
		availableRepos: repoState.availableRepos,
		selectedRepos: repoState.selectedRepos,
		theme: appState.theme
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

		const {availableRepos,repos,theme,selectedRepos = []} = this.props

		const themeStyles = theme.repoPanel

		return <div style={styles.list}>
			{availableRepos
				.filter(availRepo => _.isString(availRepo.id))
				.map((availRepo,availRepoIndex) => {
					const id = availRepo.id
					const repo = _.find(repos,(it) => it.id === availRepo.repoId)
					const isSelected = !!selectedRepos.find(selectedAvailRepo => selectedAvailRepo.id === availRepo.id)
					const isEnabled = availRepo.enabled
					const isHovering = this.state.hoverId === availRepo.id

					const onSyncClicked = (e) => {
						e.preventDefault()
						e.stopPropagation()

						repoActions.syncRepoDetails(availRepo)
						return false
					}

					return <div key={id}
					           onMouseEnter={() => this.setState({hoverId:availRepo.id})}
					           onMouseLeave={() => this.setState({hoverId:null})}
					           onClick={(event) => {
									this.onAvailRepoClicked(availRepo,availRepoIndex,isSelected,event)
					           }}
					           style={makeStyle(
					                styles.item,
					                themeStyles.list.item,
					                isEnabled && styles.itemEnabled,
					                isEnabled && themeStyles.list.itemEnabled,
					                isHovering && themeStyles.list.itemHover,
					                isSelected && themeStyles.list.itemSelected,
					                (isSelected && isHovering) && themeStyles.list.itemSelectedHover
				                )}>
						<Icon style={styles.itemIcon}>{isEnabled ? 'check' : 'radio_button_unchecked'}</Icon>
						<div style={styles.itemLabel}>{Renderers.repoName(repo)}</div>
					</div>
				})
			}
		</div>
	}


}