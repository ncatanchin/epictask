import { List } from "immutable"
import { Icon, PureRender, RepoLabel } from "epic-ui-components"
import { AvailableRepo } from "epic-models"
import { connect } from "react-redux"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { createDeepEqualSelector, stopEvent } from "epic-global"
import { createStructuredSelector } from "reselect"
import { selectedRepoIdsSelector, availableReposSelector, getRepoActions } from "epic-typedux"
import ReposPanelController from "epic-ui-repos/ReposPanelController"
import ReposPanelState from "epic-ui-repos/ReposPanelState"

/**
 * Displays a list of repos
 */
const
	log = getLogger(__filename)


//region Styles
function baseStyles(topStyles, theme, palette) {
	const
		{
			accent,
			warn,
			text,
			primary,
			secondary,
			background
		} = palette,
		colorTrans = Styles.makeTransition(['color','background-color'])
	
	return {
		list: [ Styles.FlexColumn, Styles.FlexScale, Styles.FlexAlignStart, Styles.FillWidth, {
			overflowY: 'auto',
			margin: 0,
			padding: 0,
			border: 0,
			
			
		} ],
		
		item: [ colorTrans,Styles.makeTransition(null, 0.15), Styles.FlexColumnCenter, Styles.FlexAuto, Styles.FillWidth, {
			listStyle: 'none',
			margin: 0,
			cursor: 'pointer',
			alignItems: 'center',
			fontSize: themeFontSize(1.4),
			
			backgroundColor: primary.hue3,
			borderStyle: 'solid',
			borderColor: 'transparent',
			borderBottomWidth: '0.1rem',
			borderBottomColor: theme.inactiveColor,
			
			enabled: {
				fontSize: themeFontSize(1.4)
			},
			
			row: [ colorTrans,Styles.FlexRowCenter, Styles.FlexAuto, Styles.FillWidth ],
			
			
			label: [ Styles.makeTransition([ 'flex', 'flex-basis', 'flex-shrink', 'flex-grow', 'width' ]), Styles.FlexScale, Styles.Ellipsis, Styles.makePaddingRem(1), {
				
				justifyContent: 'flex-start',
				fontSize: themeFontSize(1.5),
				fontWeight: 100
			} ],
			
			
			description: [ colorTrans,Styles.FlexScale, Styles.makePaddingRem(1), {
				backgroundColor: background
			} ],
			
		} ],
		
		
		icon: [ Styles.makeTransition([ 'width', 'opacity' ]), Styles.OverflowHidden, Styles.makePaddingRem(0), Styles.makeMarginRem(0,0.5), {
			fontSize: rem(1.5),
			display: 'block',
			
			action: [ {
				//flexBasis: 0,
				opacity: 0,
				width: 0,
				
				// ON HOVER SHOW
				hover: [ makePaddingRem(0, 0.2), {
					//flexBasis: 'auto',
					width: rem(1.7),
					opacity: 1
				} ]
			} ],
			
			
		} ],
		
	}
}


//endregion


//region Props
export interface IRepoListProps extends IThemedAttributes {
	viewController:ReposPanelController
	viewState:ReposPanelState
	
	availableRepos?:List<AvailableRepo>
	availableRepoIds?:number[]
	styleName?:string
}
//endregion

/**
 * A list of repos
 */

@connect(createStructuredSelector({
	availableRepos: availableReposSelector
}, createDeepEqualSelector))
@ThemedStyles(baseStyles, 'repoPanel')
@PureRender
export class RepoList extends React.Component<IRepoListProps,any> {
	
	
	constructor(props = {}, context = {}) {
		super(props, context)
		
		this.state = { hoverId: null }
	}
	
	
	get baseStyles() {
		return baseStyles
	}
	
	/**
	 * Enable/Disable repos
	 *
	 * @param availRepo
	 * @param availRepoIndex
	 * @param isSelected
	 * @param event
	 */
	private onAvailRepoClicked = (availRepo:AvailableRepo, availRepoIndex:number, isSelected:boolean, event:any) => {
		log.info(`Avail repo clicked`, availRepo)
		
		this.props.viewController.updateState({selectedRepoId:availRepo.id})
	}
	
	/**
	 * Open settings for available repo
	 *
	 * @param e
	 * @param availRepoId
	 */
	private onSettingsClicked = (e:React.MouseEvent<any>, availRepoId) => {
		stopEvent(e)
		getRepoActions().openRepoSettings(availRepoId)
	}
	
	/**
	 * Remove available repo
	 *
	 * @param e
	 * @param availRepoId
	 */
	private onRemoveClicked = (e:React.MouseEvent<any>, availRepoId) => {
		stopEvent(e)
		getRepoActions().removeAvailableRepo(availRepoId)
	}
	
	/**
	 * Render the list
	 */
	render() {
		
		const {
			availableRepos,
			theme,
			styles,
			viewState
		} = this.props,
			{selectedRepoId} = viewState
		
		
		return <div style={styles.list}>
			{availableRepos && availableRepos
				.map((availRepo, availRepoIndex) => {
					const
						id = availRepo.id,
						{ repo } = availRepo, //_.find(repos,(it) => it.id === availRepo.repoId)
						isSelected = selectedRepoId === availRepo.repoId,
						isHovering = this.state.hoverId === availRepo.repoId,
						
						itemStyle = makeStyle(
							isHovering && styles.item.hover,
							isSelected && styles.item.selected,
							(isSelected && isHovering) && styles.item.selected.hover
						)
					
					return <div
						key={'repoList-' + id}
						onMouseEnter={() => this.setState({hoverId:availRepo.repoId})}
						onMouseLeave={() => this.setState({hoverId:null})}
						onClick={(event) =>
						  this.onAvailRepoClicked(availRepo,availRepoIndex,isSelected,event)
	          }
						style={[
              styles.item,
              itemStyle
            ]}>
						
						{/* TOP ROW - TITLE + ACTIONS */}
						<div style={[styles.item.row,itemStyle]}>
							
							{/* Repo */}
							<RepoLabel repo={repo} style={styles.item.label}/>
							
							
							{/* SETTINGS CONTROL */}
							<RepoAction
								availRepo={availRepo}
								isHovering={isHovering}
								styles={styles}
								iconName='settings'
								onClick={e => this.onSettingsClicked(e,id)}/>
							
							
							{/* REMOVE CONTROL */}
							<RepoAction
								availRepo={availRepo}
								isHovering={isHovering}
								styles={styles}
								iconName='remove_circle'
								onClick={e => this.onRemoveClicked(e,id)}/>
						</div>
						
						{/* BOTTOM ROW - TITLE + ACTIONS */}
						<div style={[styles.item.row,itemStyle]}>
							<div style={[styles.item.description,itemStyle]}>
								{repo.description || "A description has not been provided"}
							</div>
						</div>
					</div>
				})
			}
		</div>
	}
	
	
}


const RepoAction = Radium(({ availRepo, isHovering, styles, iconName, onClick }) => {
	return <Icon
		style={[
								styles.icon,
								styles.icon.action,
								isHovering && styles.icon.action.hover
							]}
		onClick={onClick}
	>
		{iconName}
	</Icon>
})