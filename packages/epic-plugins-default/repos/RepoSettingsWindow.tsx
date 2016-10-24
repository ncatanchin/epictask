/**
 * Created by jglanz on 6/14/16.
 */

// Imports

import { createStructuredSelector } from 'reselect'
import { connect } from 'react-redux'
import { User } from "epic-models"
import { ThemedStyles } from "epic-styles"
import { appUserSelector } from "epic-typedux"
import { DialogRoot } from "epic-ui-components"
import { getUIActions, getRepoActions } from "epic-typedux"
import {
	FlexColumn, FlexAuto, FlexRowCenter, FillHeight, makeFlex,
	OverflowAuto, FillWidth, FlexScale, Ellipsis, makePaddingRem, rem, Fill, makeStyle, makeHeightConstraint,
	makeTransition, PositionRelative, OverflowHidden, FlexRow, makeFlexAlign, FlexAlignStart
} from "epic-styles"
import { CommandComponent, CommandContainerBuilder, CommandRoot } from  "epic-command-manager"
import { ContainerNames } from "epic-command-manager"
import { PureRender, Select, ISelectItem, RepoName, Icon, Button } from "epic-ui-components"
import { IThemedAttributes } from "epic-styles"

import { Repo, AvailableRepo, Milestone, Label } from "epic-models"
import { List } from "immutable"
import { canEditRepo } from "epic-common"
import {
	enabledAvailableReposSelector, enabledLabelsSelector,
	enabledMilestonesSelector
} from "epic-typedux"
import { getValue } from  "epic-common"
import { TabTemplate } from "epic-ui-components"
import { Tab, Tabs, TextField } from 'material-ui'

import { RepoMilestoneEditor,RepoLabelEditor } from "epic-plugins-default"

const
	log = getLogger(__filename)

// DEBUG
log.setOverrideLevel(LogLevel.DEBUG)


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
export interface IRepoSettingsWindowProps extends IThemedAttributes {
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
	repos: enabledAvailableReposSelector,
	
	milestones: enabledMilestonesSelector
}))
@CommandComponent()
@ThemedStyles(baseStyles, 'dialog', 'RepoSettingsWindow', 'form')
@PureRender
export class RepoSettingsWindow extends React.Component<IRepoSettingsWindowProps,IRepoSettingsWindowState> {
	
	
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
		const
			childWindowId = getChildWindowId()
		
		if (childWindowId)
			getUIActions().closeWindow(childWindowId)
	}
	
	/**
	 * On cancel - call hide
	 */
	private close = this.hide
	
	
	private checkState = (props = this.props) => {
		let
			selectedRepo = getValue(() => this.state.selectedRepo)
		
		const
			{ repos } = props
		
		if (selectedRepo && repos.find(repo => repo.id === selectedRepo.id))
			return
		
		selectedRepo = repos.size && repos.get(0)
		
		if (selectedRepo)
			this.setState({ selectedRepo })
		
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
	 * @param item
	 */
	private selectRepo = (item:ISelectItem) => {
		this.setState({
			selectedRepo: this.props.repos.find(it => it.id === item.value)
		})
	}
	
	
	render() {
		const
			{ repos, styles, theme, palette } = this.props,
			{ selectedRepo, activeTab } = this.state,
			
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				Repo Settings
			</div>,
			
			repoItems = repos
				.filter(repo => canEditRepo(repo.repo))
				.map(repo => ({
					key: repo.id,
					value: repo.id,
					node: <RepoName style={styles.repoSelect.repoName} repo={repo.repo}/>
				})).toArray(),
			
			iconStyle = styles.tabs.items.icon,
			
			activeIconStyle = makeStyle(iconStyle, styles.tabs.items.active),
			
			getIconStyle = (tabName) => activeTab === tabName ? activeIconStyle : iconStyle
		
		log.info(`Repo items`, repoItems, repos, selectedRepo, 'labels', getValue(() => selectedRepo.labels))
		
		//[createCancelButton(theme,palette,this.close)]
		return <CommandRoot
			id={ContainerNames.RepoSettingsWindow}
			component={this}
			style={makeStyle(Fill)}>
			
			<DialogRoot
				titleMode='horizontal'
				titleNode={titleNode}
				titleActionNodes={
					<Select items={repoItems}
									style={styles.repoSelect}
									labelStyle={styles.repoSelect.label}
					        onSelect={this.selectRepo}
					        underlineShow={false}
					        value={selectedRepo.id} />
				}
				styles={styles.dialog}
			>
				
				<Tabs
					style={makeStyle(FlexColumn,FlexScale)}
					tabItemContainerStyle={styles.tabs.items}
					contentContainerStyle={makeStyle(FlexColumn,FlexScale)}
					tabTemplate={TabTemplate}
				>
					<Tab
						iconStyle={getIconStyle(Tags)}
						icon={<Icon iconSet="octicon" iconName="tag"/> }
						onActive={this.makeOnActive(Tags)}
						style={FillHeight}
						label={<span style={makeStyle(activeTab === Tags && styles.tabs.items.active)}>TAGS</span>}
					>
						{
							selectedRepo &&
							activeTab === Tags &&
							<RepoLabelEditor repo={selectedRepo}/>}
					</Tab>
					
					
					<Tab
						iconStyle={getIconStyle(Milestones)}
						icon={<Icon iconSet="octicon" iconName="milestone"/> }
						onActive={this.makeOnActive(Milestones)}
						style={FillHeight}
						label={<span style={makeStyle(activeTab === Milestones && styles.tabs.items.active)}>MILESTONES</span>}
					>
						
						{
							selectedRepo &&
							activeTab === Milestones &&
							<RepoMilestoneEditor repo={selectedRepo}/>}
					</Tab>
				</Tabs>
			
			
			</DialogRoot>
		</CommandRoot>
	}
	
}


export default RepoSettingsWindow