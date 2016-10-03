// Imports
import * as React from 'react'
import { PureRender } from 'ui/components/common/PureRender'
import { SearchItem, SearchType, ISearchState } from "shared/actions/search"
import { shallowEquals, getValue } from "shared/util/ObjectUtil"
import { AvailableRepo, Issue, Milestone, Label, Repo, User } from "shared/models"
import { RepoName } from "ui/components/common/Renderers"
import filterProps from 'react-valid-props'
import { Icon } from "ui/components/common"
import { SearchPanel } from "ui/components/search"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [ FlexColumn, FlexAuto, {} ]
})


/**
 * ISearchResultItemProps
 */
export interface ISearchResultItemProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
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

export class SearchResultItem extends React.Component<ISearchResultItemProps,ISearchResultItemState> {
	
	constructor(props:ISearchResultItemProps,context) {
		super(props,context)
		
		
		const
			[selectedIndex,item] = props.searchPanel.getSelectedIndexAndItem()
		
		this.state = {
			selected: (item && item.id) === getValue(() => props.item.id)
		}
		
	}
	
	
	renderResult(label:any,labelSecond:any,actionLabel,typeLabel,isSelected) {
		const
			{styles} = this.props,
			
			// Make style
			resultStyle = makeStyle(
				styles.result,
				styles.result.normal,
				isSelected && styles.result.selected
			),
			
			actionStyle = makeStyle(
				styles.result.action,
				isSelected && styles.result.action.selected,
			),
			
			labelStyle = makeStyle(
				styles.result.label,
				isSelected && styles.result.label.selected
			),
			
			typeStyle = makeStyle(
				styles.result.type,
				isSelected && styles.result.type.selected
			)
		
		return <div style={resultStyle}>
			<div style={typeStyle}>
				<Icon iconSet='octicon' iconName={typeLabel}/>
				{/*{typeLabel}*/}
			</div>
			<div style={styles.result.info}>
				<div style={labelStyle}>
					{label}
				</div>
				{/*<div style={actionStyle}>*/}
				{/*{actionLabel}*/}
				{/*</div>*/}
			</div>
			<div style={makeStyle(labelStyle,styles.result.label.second)}>
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
	
	private renderFns = {
		[SearchType.Repo]: this.renderRepo,
		[SearchType.AvailableRepo]: this.renderAvailableRepo,
		[SearchType.Issue]: this.renderIssue,
		[SearchType.Milestone]: this.renderMilestone,
		[SearchType.Label]: this.renderLabel,
		[SearchType.Assignee]: this.renderAssignee,
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
			{selected} = state,
			resultStyle = makeStyle(
				styles.result,
				styles.result.normal,
				selected && styles.result.selected
			)
		
		const
			resultRenderer:any = this.renderFns[type],
			itemContent = resultRenderer(item,item.value,selected)
		
		
		return <div {...filterProps(props)} className={`${props.className || ''} ${selected && 'selected'}`}>
			{itemContent}
		</div>
	}
	
}