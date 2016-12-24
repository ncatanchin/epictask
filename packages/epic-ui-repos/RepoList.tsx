

import {List} from 'immutable'

import {Icon} from "epic-ui-components"
import {AvailableRepo} from "epic-models"
import {connect} from 'react-redux'
import {ThemedStyles} from "epic-styles"
import {createDeepEqualSelector} from  "epic-global"
import {createStructuredSelector} from 'reselect'
import {
	selectedRepoIdsSelector,
	availableReposSelector
} from "epic-typedux"
import { getRepoActions } from "epic-typedux"

import { CircularProgress} from "material-ui"
import { PureRender } from "epic-ui-components/common/PureRender"
import { RepoLabel } from "epic-ui-components/common"

/**
 * Displays a list of repos
 */
const
	log = getLogger(__filename)


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
			
			
			
			label: [makeTransition(['flex','flex-basis','flex-shrink','flex-grow','width']),FlexScale,Ellipsis,{
				padding: '0.2rem 0.2rem 0 0.5rem',
				justifyContent: 'flex-start',
				// fontSize: themeFontSize(1.1),
				fontWeight: 100
			}],
			
			icon: [makeTransition(['width','opacity']),OverflowHidden,makePaddingRem(0),{
				fontSize: rem(1.3),
				display: 'block',
				
				remove: [{
					//flexBasis: 0,
					opacity: 0,
					width: 0,
					
					// ON HOVER SHOW
					hover: [makePaddingRem(0,0.2),{
						//flexBasis: 'auto',
						width: rem(1.7),
						opacity: 1
					}]
				}],
				
				
			}],
			
			loading: [FlexColumnCenter,FillHeight,OverflowHidden,makeTransition(['width','opacity']),{
				width: rem(1.7),
				opacity: 1,
				not: [{
					opacity:0,
					width: 0
				}]
			}]
		}]
	}]

})

//endregion


//region Props
export interface IRepoListProps {
	availableRepos?:List<AvailableRepo>
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
	availableRepos: availableReposSelector,
	selectedRepoIds: selectedRepoIdsSelector
}, createDeepEqualSelector))
@ThemedStyles(baseStyles,'repoPanel')
@PureRender
export class RepoList extends React.Component<IRepoListProps,any> {

	

	constructor(props = {},context = {}) {
		super(props,context)

		this.state = {hoverId:null}
	}
	
	
	get baseStyles() {
		return baseStyles
	}
	
	// /**
	//  * When to update
	//  *
	//  * @param nextProps
	//  * @param nextState
	//  * @param nextContext
	//  * @returns {boolean}
	//  */
	// shouldComponentUpdate(nextProps:IRepoListProps, nextState:any, nextContext:any):boolean {
	// 	return !shallowEquals(this.props,nextProps,'theme','styles','selectedRepoIds','availableRepos') ||
	// 		!shallowEquals(this.state,nextState,'hoverId')
	// }
	
	/**
	 * Enable/Disable repos
	 *
	 * @param availRepo
	 * @param availRepoIndex
	 * @param isSelected
	 * @param event
	 */
	onAvailRepoClicked = (availRepo:AvailableRepo,availRepoIndex:number,isSelected:boolean,event:any) => {
		log.info(`Avail repo clicked`,availRepo)
		
		const
			repoActions = getRepoActions()
		
		if (event.metaKey) {
			repoActions.setRepoSelected(availRepo.repoId,!isSelected)
		} else {
			if (this.props.selectedRepoIds.length) {
				repoActions.clearSelectedRepos()
			}

		}
	}

	onRemoveClicked = (e:React.MouseEvent<any>,availRepoId) => {
		const repoActions = getRepoActions()

		e.preventDefault()
		e.stopPropagation()

		repoActions.removeAvailableRepo(availRepoId)

	}
	
	render() {

		const {
			availableRepos,
			theme,
			styles,
			selectedRepoIds = []
		} = this.props

		

		return <div style={styles.list}>
			{availableRepos && availableRepos
				.map((availRepo,availRepoIndex) => {
					const
						id = availRepo.id,
						{repo} = availRepo, //_.find(repos,(it) => it.id === availRepo.repoId)
						isSelected = !!selectedRepoIds.includes(availRepo.repoId),
						isHovering = this.state.hoverId === availRepo.repoId,
						isLoading = availRepo.repoLoadStatus === LoadStatus.Loading || availRepo.issuesLoadStatus === LoadStatus.Loading
						

					

					
					return <div key={'repoList-' + id}
					           onMouseEnter={() => this.setState({hoverId:availRepo.repoId})}
					           onMouseLeave={() => this.setState({hoverId:null})}
					           onClick={(event) =>
										  this.onAvailRepoClicked(availRepo,availRepoIndex,isSelected,event)
					           }
					           style={[
				                styles.list.item,
				                isHovering && styles.list.item.hover,
				                isSelected && styles.list.item.selected,
				                (isSelected && isHovering) && styles.list.item.selected.hover
			                ]}>
						

						{/* Repo */}
						<RepoLabel repo={repo} style={styles.list.item.label}/>
						
						{/* LOADING INDICATOR */}
						
						<div style={[styles.list.item.loading.not, isLoading && styles.list.item.loading ]}>
							{
								(isLoading) &&
								
								<CircularProgress
									color={theme.progressIndicatorColor}
									size={12}/>
								
								
							}
						</div>
						
						
						{/* REMOVE CONTROL */}
						<Icon
							style={[
								styles.list.item.icon,
								styles.list.item.icon.remove,
								isHovering && styles.list.item.icon.remove.hover
							]}
						  onClick={(e) => this.onRemoveClicked(e,id)}
						>
							remove_circle
						</Icon>
						
					</div>
				})
			}
		</div>
	}


}
