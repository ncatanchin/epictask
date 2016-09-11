


import * as React from 'react'
import {Icon} from 'ui/components/common/Icon'
import * as Renderers from 'ui/components/common/Renderers'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {Repo} from 'shared/models/Repo'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {ThemedStyles} from "shared/themes/ThemeManager"
import {createDeepEqualSelector} from "shared/util/SelectorUtil"
import {createStructuredSelector} from 'reselect'
import {selectedRepoIdsSelector, availableRepoIdsSelector} from 'shared/actions/repo/RepoSelectors'
import {PureRender} from "ui/components/common/PureRender"
import {DataComponent, MapData} from "ui/components/data/DataComponent"

/**
 * Displays a list of repos
 */
const log = getLogger(__filename)




//region Styles
const baseStyles = createStyles({
	list: [FlexColumn,FlexScale,FlexAlignStart,FillWidth,{
		overflowY: 'auto',
		margin: 0,
		padding: 0,
		border: 0,
		
		item: [makeTransition(null,0.15),FlexRowCenter,FlexAuto,FillWidth,{
			listStyle: 'none',
			margin: 0,
			padding: '0.5rem 0.5rem',
			cursor: 'pointer',
			alignItems: 'center',
			fontSize: themeFontSize(1.1),
			borderStyle: 'solid',
			borderWidth: 0,
			borderBottomWidth: '0.1rem',
			borderColor: 'transparent',
			enabled: {
				fontSize: themeFontSize(1.3)
			},
			
			
			
			label: [FlexScale,Ellipsis,{
				padding: '0.2rem 0.2rem 0 0.5rem',
				justifyContent: 'flex-start',
				// fontSize: themeFontSize(1.1),
				fontWeight: 100
			}],
			
			icon: [FlexAuto,{
				padding: '0 0.2rem',
				fontSize: rem(1.3),
				
				remove: [FlexAuto,{
					padding: '0 0.2rem',
					fontSize: rem(1.3),
					opacity: 0,
					':hover': {
						opacity: 1
					}
				}]
			}]
		}]
	}]

})

//endregion


//region Props
export interface IRepoListProps {
	availableRepos?:AvailableRepo[]
	availableRepoIds?:number[]
	styleName?:string
	className?:string
	style?:any
	selectedRepoIds?:number[]
	theme?: any
	styles?:any
}
//endregion

/**
 * A list of repos
 */
@connect(createStructuredSelector({
	availableRepoIds: availableRepoIdsSelector,
	selectedRepoIds: selectedRepoIdsSelector
}, createDeepEqualSelector))
@DataComponent(
	MapData(
		AvailableRepo,
		'availableRepoIds',
		'id',
		'availableRepos',
		[]
	)
)
@ThemedStyles(baseStyles,'repoPanel')
@PureRender
export class RepoList extends React.Component<IRepoListProps,any> {


	constructor(props = {},context = {}) {
		super(props,context)

		this.state = {hoverId:null}
	}

	onAvailRepoClicked = (availRepo:AvailableRepo,availRepoIndex:number,isSelected:boolean,event:any) => {
		const repoActions = Container.get(RepoActionFactory)
		if (event.metaKey) {
			repoActions.setRepoSelected(availRepo.repoId,!isSelected)
		} else {
			if (this.props.selectedRepoIds.length) {
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

		const {
			availableRepos,
			styles,
			selectedRepoIds = []
		} = this.props

		

		return <div style={styles.list}>
			{availableRepos && availableRepos
				.map((availRepo,availRepoIndex) => {
					const
						id = availRepo.repoId,
						{repo} = availRepo, //_.find(repos,(it) => it.id === availRepo.repoId)
						isSelected = !!selectedRepoIds.includes(availRepo.repoId),
						isEnabled = availRepo.enabled,
						isHovering = this.state.hoverId === availRepo.repoId
						

					

					
					return <div key={id}
					           onMouseEnter={() => this.setState({hoverId:availRepo.repoId})}
					           onMouseLeave={() => this.setState({hoverId:null})}
					           onClick={(event) => {
												this.onAvailRepoClicked(availRepo,availRepoIndex,isSelected,event)
					           }}
					           style={[
					                styles.list.item,
					                isEnabled && styles.list.item.enabled,
					                isHovering && styles.list.item.hover,
					                isSelected && styles.list.item.selected,
					                (isSelected && isHovering) && styles.list.item.selected.hover
				                ]}>
						<Icon style={styles.list.item.icon}>{isEnabled ? 'check' : 'radio_button_unchecked'}</Icon>

						{/* Repo */}
						<Renderers.RepoName repo={repo} style={styles.list.item.label}/>
						

						<Icon
							style={[
								styles.list.item.icon,
								styles.list.item.icon.remove,
								isHovering && {opacity:1}
							]}
						  onClick={(e) => this.onRemoveClicked(e,id)}
						>
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