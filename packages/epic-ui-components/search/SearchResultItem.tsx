// Imports
import { PureRender } from "epic-ui-components/common/PureRender"
import { RepoLabel } from "epic-ui-components/common/Labels"
import { Icon } from "epic-ui-components/common/icon/Icon"

import { AvailableRepo, Issue, Milestone, Label, Repo, User, SearchItem } from "epic-models"
import filterProps from "react-valid-props"

import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { SearchController, SearchEvent } from "epic-ui-components/search/SearchController"
import { MappedProps } from "epic-global/UIUtil"
import { getValue } from "typeguard"
import baseStyles from './SearchResultItem.styles'
import { Flex, FlexRow, FlexRowCenter, FlexScale } from 'epic-ui-components/common/FlexLayout'
import { SearchState } from "./SearchState"
import { connect } from "react-redux"
import { makeViewStateSelector } from "epic-typedux/selectors"
import {createStructuredSelector,createSelector} from 'reselect'
// Constants
const
	log = getLogger(__filename)


/**
 * ISearchResultItemProps
 */
export interface ISearchResultItemProps extends IThemedAttributes {
	item: SearchItem
	groupByProvider: boolean
	viewController:SearchController
	//searchState?:SearchState
	selected?: boolean
}

/**
 * ISearchResultItemState
 */
export interface ISearchResultItemState {
	
}

/**
 * SearchResultItem
 *
 * @class SearchResultItem
 * @constructor
 **/
// @MappedProps((props: ISearchResultItemProps, mapper) => {
// 	const
// 		{ item, controller } = props,
// 		state = controller.getState(),
// 		{ selectedIndex, items } = state,
// 		index = items.indexOf(item)
//
// 	return {
// 		selected: index === selectedIndex
// 	}
// }, {
// 	onMount(mapper, props, data) {
// 		data.onStateChange = () => {
// 			log.debug(`Remapping with props`, props)
// 			setImmediate(() => mapper.remap())
// 		}
// 		props.controller.addListener(SearchEvent[ SearchEvent.StateChanged ], data.onStateChange)
// 	},
//
// 	onUnmount(mapper, props, data) {
// 		if (data.onStateChange)
// 			props.controller.removeListener(SearchEvent[ SearchEvent.StateChanged ], data.onStateChange)
//
// 		data.onStateChange = null
// 	}
//
//
// })
// @connect(() => createStructuredSelector({
// 	selected: createSelector(
// 		SearchController.makeSearchStateSelector(),
// 		(state,props) => props.item,
// 		(searchState:SearchState,item) =>
// 			searchState.selectedIndex === searchState.items.indexOf(item)
// 	)
// }))
@ThemedStyles(baseStyles)
@PureRender
export class SearchResultItem extends React.Component<ISearchResultItemProps,ISearchResultItemState> {
	
	constructor(props: ISearchResultItemProps, context) {
		super(props, context)
		
	}
	
	/**
	 * Default render for an item
	 *
	 * @param item
	 * @param label
	 * @param labelSecond
	 * @param actionLabel
	 * @param iconName
	 * @param isSelected
	 * @returns {any}
	 */
	renderResult(item: SearchItem, label: any, labelSecond: any, actionLabel, iconName, isSelected) {
		const
			{ styles, groupByProvider } = this.props,
			
			firstProviderResult = item.providerResultIndex === 0,
			
			// Make style
			resultStyle = makeStyle(
				styles,
				styles.normal,
				isSelected && styles.selected,
				groupByProvider && !firstProviderResult && { borderTop: '0.1rem solid transparent' }
			),
			
			labelStyle = makeStyle(
				styles.label,
				isSelected && styles.label.selected
			),
			
			typeStyle = makeStyle(
				styles.type,
				isSelected && styles.type.selected
			)
		
		return <FlexRowCenter style={[resultStyle,Styles.FlexScale]}>
			
			{/* IF GROUPING THEN SHOW PROVIDER LABEL */}
			{groupByProvider ?
				<Flex style={[typeStyle,{width: '25%'}]}>
					{firstProviderResult &&
					<FlexRowCenter style={[FlexScale,FillWidth]}>
						<Icon style={[Styles.FlexAuto,Styles.makePaddingRem(0,2,0,1)]} iconSet='octicon' iconName={iconName}/>
						<FlexScale style={[Styles.Ellipsis]}>
							{item.provider.name}
						</FlexScale>
					</FlexRowCenter>
					}
				</Flex> :
				<Icon style={[Styles.FlexAuto,Styles.makePaddingRem(0,2,0,1)]} iconSet='octicon' iconName={iconName}/>
			}
			
			<FlexScale>
				<div style={[resultStyle,{borderTop: 'none'}]}>
					
					<div style={styles.info}>
						<div style={labelStyle}>
							{label}
						</div>
					</div>
					<div style={makeStyle(labelStyle,styles.label.second)}>
						{labelSecond}
					</div>
				
				</div>
			</FlexScale>
		</FlexRowCenter>
		
	}
	
	
	renderRepo = (item: SearchItem, repo: Repo, isSelected) => {
		
		return this.renderResult(
			item,
			<RepoLabel repo={repo}/>,
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
	renderAvailableRepo = (item: SearchItem, availRepo: AvailableRepo, isSelected) => {
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
	
	renderIssue = (item: SearchItem, issue: Issue, isSelected) => {
		const repo = null//repoModels && repoModels.get(`${issue.repoId}`)
		return this.renderResult(
			item,
			issue.title,
			repo ? <RepoLabel repo={repo}/> : '',
			'Select issue',
			'issue-opened',
			isSelected
		)
	}
	
	renderMilestone = (item: SearchItem, milestone: Milestone, isSelected) => {
		
		const repo = null//repoModels && repoModels.get(`${milestone.repoId}`)
		return this.renderResult(
			item,
			milestone.title,
			repo ? <RepoLabel repo={repo}/> : '',
			'Filter milestone',
			'milestone',
			isSelected
		)
	}
	
	renderLabel = (item: SearchItem, label: Label, isSelected) => {
		
		const
			repo = getValue(() => item.value.repo) //repoModels && repoModels.get(`${label.repoId}`)
		
		return this.renderResult(
			item,
			label.name,
			repo ? <RepoLabel repo={repo}/> : '',
			'Filter label',
			'tag',
			isSelected
		)
	}
	
	renderAssignee = (item: SearchItem, user: User, isSelected) => {
		
		return this.renderResult(
			item,
			user.login,
			user.login,
			'Filter Assignee',
			'person',
			isSelected
		)
	}
	
	
	renderAction = (item: SearchItem, cmd: ICommand, isSelected) => {
		
		return this.renderResult(
			item,
			cmd.name,
			cmd.description,
			'Execute',
			'zap',
			isSelected
		)
	}
	
	private itemRenderContentFns = {
		[Repo.$$clazz]: this.renderRepo,
		['Github']: this.renderRepo,
		[AvailableRepo.$$clazz]: this.renderAvailableRepo,
		[Issue.$$clazz]: this.renderIssue,
		[Milestone.$$clazz]: this.renderMilestone,
		[Label.$$clazz]: this.renderLabel,
		['Assignee']: this.renderAssignee,
		['Action']: this.renderAction,
	}
	
	
	private resultRender(provider, item, selected) {
		const
			content = (this.itemRenderContentFns[ provider.id ] as any)(
				item,
				item.value,
				selected
			)
		
		return content
	}
	
	render() {
		const
			{ props } = this,
			{ item, selected,viewController } = props,
			{ provider } = item
		
		const
			itemContent = provider.render ?
				provider.render(item, selected) :
				this.resultRender(provider, item, selected)
		
		if (selected)
			viewController.ensureItemVisible(this)
		
		return <div {...filterProps(props)} className={`${props.className || ''} ${selected && 'selected'}`}>
			{itemContent}
		</div>
	}
	
}