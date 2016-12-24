/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import { createStructuredSelector } from "reselect"
import { connect } from "react-redux"
import { User, AvailableRepo, Milestone } from "epic-models"
import {
	ThemedStyles,
	FlexColumn,
	FlexAuto,
	FlexRowCenter,
	FillHeight,
	OverflowAuto,
	FillWidth,
	FlexScale,
	Ellipsis,
	makePaddingRem,
	rem,
	Fill,
	makeStyle,
	makeHeightConstraint,
	OverflowHidden,
	FlexRow,
	makeFlexAlign,
	FlexAlignStart,
	IThemedAttributes
} from "epic-styles"
import { appUserSelector, availableReposSelector, milestonesSelector } from "epic-typedux"
import { DialogRoot, PureRender, FlexColumnCenter, Icon, RepoSelect, Tabs } from "epic-ui-components"
import { CommandComponent, CommandRoot, CommandContainerBuilder } from "epic-command-manager-ui"
import { ContainerNames } from "epic-command-manager"
import { List } from "immutable"
import { canEditRepo, getValue } from "epic-global"
import { RepoLabelEditor } from "./RepoLabelEditor"
import { RepoMilestoneEditor } from "./RepoMilestoneEditor"
import { IRouterLocation } from "epic-entry-ui/routes"


const
	log = getLogger(__filename)

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


const
	Tags = "Tags",
	Milestones = "Milestones"


const baseStyles = (topStyles, theme, palette) => {
	const
		{
			accent,
			warn,
			text,
			primary,
			secondary
		} = palette,
		
		rowStyle = [ FlexRow, FlexAuto, FlexAlignStart, FillWidth, makePaddingRem(0, 1) ]
	
	return {
		dialog: [ {
			minHeight: 500,
			minWidth: 500
		} ],
		
		root: [ FlexColumn, FlexAuto ],
		
		
		repoSelect: [OverflowHidden,{
			maxWidth: '40vw',
			//minWidth: rem(25)
			label: [
				Ellipsis,
				FlexRow,
				makeFlexAlign('center','flex-end'),
				FillWidth
			],
			
			repoName: [
				makePaddingRem(0,1),
				FillWidth,
				FlexScale,
				makeFlexAlign('center','flex-end')
			]
		}],
		
		tabs: [ {
			items: [
				makeHeightConstraint(rem(12)), {
					
					active: [ {
						color: accent.hue1
					} ],
					
					icon: [ makePaddingRem(1.5, 1), {
						fontSize: rem(4),
						
						
					} ]
				}
			],
		} ],
		
		actions: [ FlexRowCenter, FillHeight ],
		
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				fontSize: rem(1.6),
				
				
			} ]
		} ],
		
		form: [ FlexColumn, OverflowAuto, Fill, {} ],
		
	}
}


/**
 * IRepoSettingsWindowProps
 */
export interface IRepoSettingsWindowProps extends IThemedAttributes, IRouterLocation {
	user?:User
	repos?:List<AvailableRepo>
	
	milestones?:List<Milestone>
}

export interface IRepoSettingsWindowState {
	selectedRepo?:AvailableRepo
	activeTab?:string,
	editingId?:any,
	editingValues?:any
}


/**
 * RepoSettingsWindow
 *
 * @class RepoSettingsWindow
 * @constructor
 **/
@connect(createStructuredSelector({
	user: appUserSelector,
	repos: availableReposSelector,
	milestones: milestonesSelector
}))
@CommandComponent()
@ThemedStyles(baseStyles, 'dialog', 'RepoSettingsWindow', 'form')
@PureRender
export class RepoSettingsWindow extends React.Component<IRepoSettingsWindowProps,IRepoSettingsWindowState> {
	
	/**
	 * Create a settings window
	 *
	 * @param props
	 * @param context
	 */
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			activeTab: Tags
		}
	}
	
	/**
	 * Command items
	 *
	 * @param builder
	 */
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			
			.make()
	
	
	/**
	 * Component id
	 *
	 * @type {string}
	 */
	commandComponentId = ContainerNames.RepoSettingsWindow
	
	
	/**
	 * Hide/close the window
	 */
	private hide = () => {
		getCurrentWindow().close()
		// const
		// 	windowId = getWindowId()
		//
		// if (windowId)
		// 	getUIActions().closeWindow(windowId)
	}
	
	/**
	 * On cancel - call hide
	 */
	private close = this.hide
	
	/**
	 *
	 * @param props
	 */
	private checkState = (props = this.props) => {
		let
			{selectedRepo} = this.state
		
		log.debug(`Checking state`,props,'selected repo',selectedRepo)
		
		const
			repos = this.getEditableRepos(props)
		
		if (!selectedRepo && repos.size) {
			const
				repoId = getValue(() => parseInt(props.params.repoId,10)),
				repo = (repoId && repos.find(it => it.id === repoId)) || repos.get(0)
			
			this.setState({
				selectedRepo: repo
			})
		}
		
		// if (selectedRepo && repos.find(repo => repo.id === selectedRepo.id))
		// 	return
		//
		// selectedRepo = repos.size && repos.get(0)
		//
		// if (selectedRepo)
		// 	this.setState({ selectedRepo })
		
	}
	
	private makeOnActive = (tabName) => () => this.setState({
		activeTab: tabName,
		editingId: null,
		editingValues: null
	})
	
	/**
	 * Check to make sure we have a value
	 */
	componentWillMount = this.checkState
	
	/**
	 * on new props check state
	 */
	componentWillReceiveProps = this.checkState
	
	
	private clearEditing = () => this.setState({
		editingId: null,
		editingValues: null
	})
	
	/**
	 * Select a different repo
	 *
	 * @param selectedRepo
	 */
	private onRepoItemSelected = (selectedRepo:AvailableRepo) => {
		this.setState({
			selectedRepo
		})
	}
	
	/**
	 * get editable repos
	 *
	 * @returns {List<Repo>}
	 */
	getEditableRepos(props = this.props) {
		return props.repos
			.filter(repo => canEditRepo(repo.repo)) as List<AvailableRepo>
	}
	
	render() {
		const
			{ repos, styles, theme, palette } = this.props
		
		if (!repos || !repos.size)
			return React.DOM.noscript()
		
		const
			{ activeTab } = this.state,
			selectedRepoId = getValue(() => this.state.selectedRepo.id),
			selectedRepo = repos.find(it => it.id === selectedRepoId),
			
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				Repo Settings
			</div>,
			
			
			iconStyle = styles.tabs.items.icon,
			
			activeIconStyle = makeStyle(iconStyle, styles.tabs.items.active),
			
			getIconStyle = (tabName) => activeTab === tabName ? activeIconStyle : iconStyle
	
		//log.info(`Repo items`, repoItems, repos, selectedRepo, 'labels', getValue(() => selectedRepo.labels))
		
		//[createCancelButton(theme,palette,this.close)]
		return <CommandRoot
			id={ContainerNames.RepoSettingsWindow}
			component={this}
			style={makeStyle(Fill)}>
			
			<DialogRoot
				titleMode='horizontal'
				titleNode={titleNode}
				titleActionNodes={
					<RepoSelect
						repos={this.getEditableRepos()}
						style={styles.repoSelect}
						onItemSelected={this.onRepoItemSelected}
					  repo={selectedRepo} />
				}
				styles={styles.dialog}
			>
				
				<Tabs
					tabs={[
						{
							title: <FlexColumnCenter>
								<Icon iconSet="octicon" iconName="tag"/>
								<div>TAGS</div>
							</FlexColumnCenter>,
							
							content: selectedRepo && <RepoLabelEditor repo={selectedRepo}/>
						},
						{
							title: <FlexColumnCenter>
								<Icon iconSet="octicon" iconName="milestone"/>
								<div>MILESTONES</div>
							</FlexColumnCenter>,
							
							content: selectedRepo && <RepoMilestoneEditor repo={selectedRepo}/>
						},
						
					]}
					style={makeStyle(FlexColumn,FlexScale)}
				/>
				
			
			
			</DialogRoot>
		</CommandRoot>
	}
	
}


export default RepoSettingsWindow