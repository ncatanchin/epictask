

/**
 * Displays a list of repos
 */
const log = getLogger(__filename)

import * as React from 'react'
import {Icon,Renderers} from '../common'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {RepoKey} from 'shared/Constants'
import {AvailableRepo,Repo} from 'shared/models'
import {connect} from 'react-redux'
import * as Radium from 'radium'
// import {Button} from 'ui/components/common/Button'

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

	itemIconRemove: makeStyle(FlexAuto,{
		padding: '0 0.2rem',
		fontSize: rem(1.3),
		opacity: 0,
		':hover': {
			opacity: 1
		}
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

	return {
		availableRepos: repoState.availableRepos,
		selectedRepos: repoState.selectedRepos,
		theme: getTheme()
	}
}


/**
 * A list of repos
 */
@connect(mapToProps)
@Radium
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

			repoActions.setRepoEnabled(availRepo.repoId, !availRepo.enabled)
		}
	}

	onRemoveClicked = (e:React.MouseEvent,availRepoId) => {
		const repoActions = new RepoActionFactory()

		e.preventDefault()
		e.stopPropagation()

		repoActions.removeAvailableRepo(availRepoId)

	}

	render() {

		const {availableRepos,theme,selectedRepos = []} = this.props

		const themeStyles = theme.repoPanel

		return <div style={styles.list}>
			{availableRepos && availableRepos
				.map((availRepo,availRepoIndex) => {
					const id = availRepo.repoId
					const repo = availRepo.repo //_.find(repos,(it) => it.id === availRepo.repoId)
					const isSelected = !!selectedRepos.find(selectedAvailRepo => selectedAvailRepo.repoId === availRepo.repoId)
					const isEnabled = availRepo.enabled
					const isHovering = this.state.hoverId === availRepo.repoId

					const onSyncClicked = (e) => {
						e.preventDefault()
						e.stopPropagation()

						repoActions.syncRepoDetails(availRepo)
						return false
					}

					const itemRemoveStyle = makeStyle(
						styles.itemIcon,
						styles.itemIconRemove,
						isHovering && {opacity:1}
					)

					return <div key={id}
					           onMouseEnter={() => this.setState({hoverId:availRepo.repoId})}
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

						<Icon style={itemRemoveStyle}
						      onClick={(e) => this.onRemoveClicked(e,id)}>
							remove_circle
						</Icon>
						{/*<Button style={styles.itemIcon}>*/}
							{/**/}
						{/*</Button>*/}
					</div>
				})
			}
		</div>
	}


}