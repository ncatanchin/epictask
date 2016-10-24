// Imports
import * as React from 'react'
import { PureRender } from "epic-ui-components"
import { SearchItem, SearchType } from "epic-typedux"
import { shallowEquals, getValue } from  "epic-common"
import { AvailableRepo, Issue, Milestone, Label, Repo, User } from "epic-models"
import { RepoName } from "epic-ui-components"
import filterProps from 'react-valid-props'
import { Icon } from "epic-ui-components"
import { SearchPanel } from "epic-ui-components"
import { ICommand } from  "epic-command-manager"
import { ThemedStyles, IThemedAttributes } from "epic-styles"

// Constants
const log = getLogger(__filename)


function baseStyles(topStyles,theme,palette) {
	const
		{ accent, primary, text, secondary } = palette
	
	return [ makeTransition([ 'background-color', 'color' ]), PositionRelative, FlexRowCenter, FillWidth, {
			height: 48,
			cursor: 'pointer',
			borderBottom: `0.1rem solid ${accent.hue1}`,
			color: primary.hue1,
			
			normal: {
				backgroundColor: text.primary,
				color: primary.hue1
			},
			
			selected: [{
				backgroundColor: accent.hue1,
				color: text.primary
			}],
			
			
			info: [
				FlexScale,
				FlexColumnCenter,
				makePaddingRem(0.2,2,0.2,1),
				makeFlexAlign('stretch', 'center'), {
				
				}
			],
			
			label: [Ellipsis, FlexAuto, makePaddingRem(0, 1), {
				flexShrink: 1,
				fontWeight: 300,
				fontSize: rem(1.6),
				
				second: [FlexAuto, {
					fontWeight: 100,
					fontSize: rem(1.2)
				}],
				
				selected: [{
					fontWeight: 500
				}]
			}],
			
			action: [{
				fontWeight: 300,
				fontSize: rem(1.3),
				textStyle: 'italic',
				
				selected: [{
					
				}]
			}],
			
			type: [ FillHeight, FlexRowCenter, FlexAuto, Ellipsis, {
				fontWeight: 300,
				fontSize: rem(1.3),
				textStyle: 'italic',
				padding: rem(0.3),
				width: 48,
				background: Transparent,
				//borderRight: `0.1rem solid ${accent.hue1}`,
				
				selected: [{}]
			} ]
			
		} ]
	
}


/**
 * ISearchResultItemProps
 */
export interface ISearchResultItemProps extends IThemedAttributes {
	searchPanel:SearchPanel
	item:SearchItem
}

/**
 * ISearchResultItemState
 */
export interface ISearchResultItemState {
	selected:boolean
}

/**
 * SearchResultItem
 *
 * @class SearchResultItem
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class SearchResultItem extends React.Component<ISearchResultItemProps,ISearchResultItemState> {
	
	constructor(props:ISearchResultItemProps,context) {
		super(props,context)
		
		
		const
			[selectedIndex,item] = props.searchPanel.getSelectedIndexAndItem()
		
		this.state = {
			selected: (item && item.id) === getValue(() => props.item.id)
		}
		
	}
	
	
	renderResult(label:any,labelSecond:any,actionLabel,iconName,isSelected) {
		const
			{styles} = this.props,
			
			// Make style
			resultStyle = makeStyle(
				styles,
				styles.normal,
				isSelected && styles.selected
			),
			
			labelStyle = makeStyle(
				styles.label,
				isSelected && styles.label.selected
			),
			
			typeStyle = makeStyle(
				styles.type,
				isSelected && styles.type.selected
			)
		
		return <div style={resultStyle}>
			<div style={typeStyle}>
				<Icon iconSet='octicon' iconName={iconName}/>
				{/*{typeLabel}*/}
			</div>
			<div style={styles.info}>
				<div style={labelStyle}>
					{label}
				</div>
			</div>
			<div style={makeStyle(labelStyle,styles.label.second)}>
				{labelSecond}
			</div>
		
		</div>
	}
	
	
	
	renderRepo = (item:SearchItem, repo:Repo, isSelected) => {
		
		return this.renderResult(
			<RepoName repo={repo}/>,
			`${repo.open_issues_count} open issues`,
			'Add issue repo',
			'repo',
			isSelected
		)
	}
	
	/**
	 * Render an available repo, once already initialized
	 *
	 * @param item
	 * @param availRepo
	 * @param isSelected
	 * @returns {any}
	 */
	renderAvailableRepo = (item:SearchItem,availRepo:AvailableRepo,isSelected) => {
		// const
		// 	// Get data
		// 	availRepoSelected = availRepo.enabled,
		// 	repo = availRepo.repo || repoActions.state.stores.find(item => item.id === availRepo.repoId)
		//
		// // The wrapper element with content inside
		// // Row 1: label
		// // Row 2: possible action
		// return this.renderResult(
		// 	Renderers.repoName(repo),
		// 	`${repo.open_issues_count} open issues`,
		// 	(availRepoSelected) ? 'Hide issues' : 'Show Issues',
		// 	'repo',
		// 	isSelected)
		return null
		
	}
	
	renderIssue = (item:SearchItem,issue:Issue,isSelected) => {
		const repo = null//repoModels && repoModels.get(`${issue.repoId}`)
		return this.renderResult(
			issue.title,
			repo ? <RepoName repo={repo}/> : '',
			'Select issue',
			'issue-opened',
			isSelected
		)
	}
	
	renderMilestone = (item:SearchItem,milestone:Milestone,isSelected) => {
		
		const repo = null//repoModels && repoModels.get(`${milestone.repoId}`)
		return this.renderResult(
			milestone.title,
			repo ? <RepoName repo={repo}/> : '',
			'Filter milestone',
			'milestone',
			isSelected
		)
	}
	
	renderLabel = (item:SearchItem,label:Label,isSelected) => {
		
		const repo = null//repoModels && repoModels.get(`${label.repoId}`)
		return this.renderResult(
			label.name,
			repo ? <RepoName repo={repo}/> : '',
			'Filter label',
			'tag',
			isSelected
		)
	}
	
	renderAssignee = (item:SearchItem,user:User,isSelected) => {
		
		return this.renderResult(
			user.login,
			user.login,
			'Filter Assignee',
			'person',
			isSelected
		)
	}
	
	
	renderAction = (item:SearchItem,cmd:ICommand,isSelected) => {
		
		return this.renderResult(
			cmd.name,
			cmd.description,
			'Execute',
			'zap',
			isSelected
		)
	}
	
	private renderFns = {
		[SearchType.Repo]: this.renderRepo,
		[SearchType.AvailableRepo]: this.renderAvailableRepo,
		[SearchType.Issue]: this.renderIssue,
		[SearchType.Milestone]: this.renderMilestone,
		[SearchType.Label]: this.renderLabel,
		[SearchType.Assignee]: this.renderAssignee,
		[SearchType.Action]: this.renderAction,
	}
	
	/**
	 * Set selected
	 *
	 * @param selected
	 */
	setSelected(selected:boolean) {
		if (this.state.selected !== selected)
			this.setState({selected})
	}
	
	
	selectionChange = (selectedIndex,item) => {
		if (!item)
			return
		
		this.setSelected(this.props.item.id === item.id)
	}
	
	componentWillMount():void {
		this.props.searchPanel.addSelectionListener(this.selectionChange)
	}
	
	componentWillUnmount():void {
		this.props.searchPanel.removeSelectionListener(this.selectionChange)
	}
	
	/**
	 * On new props
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:ISearchResultItemProps, nextContext:any):void {
		
		
	}
	
	/**
	 * Only change on selection change
	 * @param nextProps
	 * @param nextState
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps,nextState) {
		return !shallowEquals(nextState,this.state,'selected')
	}
	
	
	render() {
		const
			{props,state} = this,
			{ styles,item } = props,
			{type} = item,
			{selected} = state
		
		const
			resultRenderer:any = this.renderFns[type],
			itemContent = resultRenderer(item,item.value,selected)
		
		
		return <div {...filterProps(props)} className={`${props.className || ''} ${selected && 'selected'}`}>
			{itemContent}
		</div>
	}
	
}