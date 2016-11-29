// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender, Chip, RepoLabel, FlexRow, FlexRowCenter } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { getIssuesPanelSelector, IssuesPanelController } from "epic-ui-components/pages/issues-panel"
import { colorAlpha, makePaddingRem, makeHeightConstraint, rem } from "epic-styles/styles"
import { cloneObjectShallow, cloneObject, safePush } from "epic-global"
import { SearchField } from "epic-ui-components/search"
import { ContainerNames, getCommandManager } from "epic-command-manager"
import {
	enabledMilestonesSelector, enabledAvailableReposSelector,
	enabledAssigneesSelector, enabledLabelsSelector
} from "epic-typedux/selectors"
import { SearchItem, User, Label, Milestone, Repo, DefaultIssueSort } from "epic-models"
import { isString, isNil } from "typeguard"
import { IssuesPanelSearchItem } from "epic-ui-components/pages/issues-panel/IssuesPanelSearchItem"

const
	searchQueryParser = require('search-query-parser')

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexAuto, makePaddingRem(0, 1), {
		//backgroundColor: Transparent,
		borderBottom: `0.1rem solid ${primary.hue3}`,
		
		field: [ {
			//backgroundColor: Transparent
		} ],
		
		input: [ {
			backgroundColor: Transparent,
			color: text.secondary,
			borderBottom: `0.1rem solid ${colorAlpha(text.secondary, 0.1)}`,
			fontWeight: 500,
			fontSize: themeFontSize(1.7),
			':focus': {}
		} ],
		
		hint: [ {} ]
		
	} ]
}


/**
 * IIssuesPanelSearchProps
 */
export interface IIssuesPanelSearchProps extends IThemedAttributes {
	viewController:IssuesPanelController
	criteria?:IIssueCriteria
	searchText?:string
}

/**
 * IIssuesPanelSearchState
 */
export interface IIssuesPanelSearchState {
	
}

/**
 * IssuesPanelSearch
 *
 * @class IssuesPanelSearch
 * @constructor
 **/

@connect(() => createStructuredSelector({
	criteria: getIssuesPanelSelector(selectors => selectors.criteriaSelector),
	searchText: getIssuesPanelSelector(selectors => selectors.searchTextSelector),
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class IssuesPanelSearch extends React.Component<IIssuesPanelSearchProps,IIssuesPanelSearchState> {
	
	/**
	 * Search provider
	 */
	private searchProvider = new IssuesPanelSearchProvider(this)
	
	get viewController() {
		return this.props.viewController
	}
	
	private makeCriteriaChange(fn:(criteria:IIssueCriteria) => IIssueCriteria):Function {
		return () => {
			const
				criteria = cloneObjectShallow(this.props.criteria)
			
			this.viewController.setCriteria(fn(criteria))
		}
	}
	
	/**
	 * Renderer criteria elements
	 *
	 * @param criteria
	 * @returns {Array}
	 */
	private criteriaRenderer = (criteria:IIssueCriteria) => {
		const
			{ sort } = criteria,
			storeState = getStoreState(),
			
			milestones = enabledMilestonesSelector(storeState),
			labels = enabledLabelsSelector(storeState),
			assignees = enabledAssigneesSelector(storeState),
			repos = enabledAvailableReposSelector(storeState)
		
		const
			chips = [],
			chipStyle = makeStyle(
				makeMarginRem(0, 0, 0, 0.5),
				makeHeightConstraint(rem(3))
			)
		
		// TEXT
		if (criteria.text) {
			chips.push(<Chip
				style={[chipStyle]}
				onRemove={
					this.makeCriteriaChange(criteria =>
						assign(criteria,{text:null}))
				}
				key='text'
				item={{
					id: criteria.text,
					label: `contains text: criteria.text`,
					color: 'ffffff'
				}}
			/>)
		}
		
		// CLOSED
		if (criteria.includeClosed) {
			chips.push(<Chip
				style={[chipStyle]}
				onRemove={
					this.makeCriteriaChange(criteria =>
						assign(criteria,{includeClosed:false}))
				}
				key='includeClosed'
				item={{
					id: 'includeClosed',
					label: 'include closed',
					color: 'ffffff'
				}}
			/>)
		}
		// MILESTONES
		if (criteria.milestoneIds) {
			chips.push(...criteria.milestoneIds
				.map(id => milestones.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => <Chip
					style={[chipStyle]}
					onRemove={
						this.makeCriteriaChange(criteria =>
							assign(criteria,{
								milestoneIds: criteria
									.milestoneIds
									.filter(id => it.id !== id)
							}))
					}
					key={`milestone-${it.id}`}
					item={{
						id: `milestone-${it.id}`,
						label: `milestone: ${it.title}`,
						color: '000000'
					}}
				/>)
			)
		}
		// ASSIGNEES
		if (criteria.assigneeIds) {
			chips.push(...criteria.assigneeIds
				.map(id => assignees.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => <Chip
					style={[chipStyle]}
					onRemove={
						this.makeCriteriaChange(criteria =>
							assign(criteria,{
								assigneeIds: criteria
									.assigneeIds
									.filter(id => it.id !== id)
							}))
					}
					key={`assignee-${it.id}`}
					item={{
						id: `assignee-${it.id}`,
						label: `assigned to: ${it.name || it.login}`,
						color: 'ffffff'
					}}
				/>)
			)
		}
		// REPOS
		if (criteria.repoIds) {
			const
				repoLabelStyle = {
					paddingRight: rem(0.5)
				}
			
			chips.push(...criteria.repoIds
				.map(id => repos.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => <Chip
					style={[chipStyle]}
					onRemove={
						this.makeCriteriaChange(criteria =>
							assign(criteria,{
								repoIds: criteria
									.repoIds
									.filter(id => it.id !== id)
							}))
						
					}
					key={`repo-${it.id}`}
					item={{
						id: `label-${it.id}`,
						label: <FlexRowCenter><div style={repoLabelStyle}>repo:</div><RepoLabel repo={it.repo}/></FlexRowCenter>,
						color: '000000'
					}}
				/>)
			)
		}
		// LABELS
		if (criteria.labelIds) {
			chips.push(...criteria.labelIds
				.map(id => labels.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => <Chip
					style={[chipStyle]}
					onRemove={
						this.makeCriteriaChange(criteria =>
							assign(criteria,{
								labelIds: criteria
									.labelIds
									.filter(id => it.id !== id)
							}))
						
					}
					key={`label-${it.id}`}
					item={{
						id: `label-${it.id}`,
						label: `label: ${it.name}`,
						color: it.color
					}}
				/>)
			)
		}
		
		// GROUP BY
		if (sort.groupBy && sort.groupBy !== 'none') {
			chips.push(<Chip
				style={[chipStyle]}
				onRemove={
						this.makeCriteriaChange(criteria =>
							assign(criteria,{
								sort: assign(sort,{
									groupBy: 'none'
								})
							}))
						
					}
				key={`groupBy`}
				item={{
					id: `groupBy`,
					label: `group by: ${sort.groupBy}`,
					color: 'blue'
				}}
			/>)
			
		}
		
		// SORT BY
		if (sort.fields) {
			chips.push(...sort.fields
				.filter(it => it !== 'created_at')
				.map(it => <Chip
					style={[chipStyle]}
					onRemove={
						this.makeCriteriaChange(criteria =>
							assign(criteria,{
								sort: assign(sort,{
									fields: sort.fields.filter(field => it !== field)
								})
							}))
						
					}
					key={`sortBy-${it}`}
					item={{
						id: `sortBy-${it}`,
						label: `sort by: ${it}`,
						color: 'blue'
					}}
				/>)
			)
		}
		// SORT DIRECTION
		if (sort.direction) {
			chips.push(<Chip
				style={[chipStyle]}
				onRemove={
						this.makeCriteriaChange(criteria =>
							assign(criteria,{
								sort: assign(sort,{
									direction: null
								})
							}))
						
					}
				key={`sortByDirection`}
				item={{
					id: `sortByDirection`,
					label: `sort by direction: ${sort.direction}`,
					color: 'blue'
				}}
			/>)
			
		}
		return chips
	}
	
	/**
	 * On search chip selected
	 *
	 * @param resultItem
	 */
	onItemSelected = (resultItem:ISearchItem) => {
		log.info(`Selected criteria`, resultItem)
		
		
		let
			item = resultItem.value,
			type = item.type,
			criteria = cloneObject(this.props.criteria)
		
		if (!criteria.sort)
			criteria.sort = DefaultIssueSort
		
		let
			sort = criteria.sort
		
		switch (type) {
			case "sortDirection":
				sort.direction = item.value
				break
			
			case "sortBy":
				sort.fields = safePush(sort.fields, item.value)
				break
			
			case "groupBy":
				sort.groupBy = item.value
				break
			
			case "text":
				criteria.text = item.value
				break
			
			case "includeClosed":
				criteria.includeClosed = true
				break
			
			case Milestone.$$clazz:
				criteria.milestoneIds = safePush(criteria.milestoneIds, item.value.id)
				break
			
			case Label.$$clazz:
				criteria.labelIds = safePush(criteria.labelIds, item.value.id)
				break
			
			case Repo.$$clazz:
				criteria.repoIds = safePush(criteria.repoIds, item.value.id)
				break
			
			case User.$$clazz:
				criteria.assigneeIds = safePush(criteria.assigneeIds, item.value.id)
				break
		}
		
		this.viewController.setCriteria(criteria)
		//this.viewController.setSearchText(null)
	}
	
	/**
	 * On text changed - let's see if we can parse some
	 * criteria
	 *
	 * @param newText
	 */
	private onSearchTextChanged = (newText) => {
		this.viewController.setSearchText(newText)
		return false
		
		// const
		// 	{criteria} = this.props,
		// 	opts = {
		// 		keywords: ['label','milestone','assignee','groupBy','repo','closed','sort','sortDirection']
		// 	}
		//
		// USER CHIPS - FUTURE
		// const
		// 	query = searchQueryParser.parse(newText,opts)
		//
		// let
		// 	updatedCriteria = cloneObjectShallow(criteria),
		// 	searchText = isString(query) ? query :
		// 		isString(query.text) ? query.text :
		// 			(newText || '')
		//
		// log.debug(`New search text`,newText,'parsed',query,'criteria',updatedCriteria,'viewController',this.viewController)
		//
		// FIRST SET THE TEXT
		//updatedCriteria.text = queryText
		
		
		// if (searchText !== newText) {
		// 	[false,true].forEach(exclude => {
		// 		const
		// 			keys = (exclude ? query.exclude : query)
		// 				.filter(key => !['exclude','text'].includes(key))
		//
		// 		log.debug(`Updating criteria (exclude=${exclude}) with keys`,keys)
		//
		// 		keys.forEach(key => {
		// 			key = key.toLowerCase()
		//
		// 			switch (key) {
		// 				case 'label':
		//
		// 					break
		// 				case 'milestone':
		//
		// 					break
		// 				case 'assignee':
		//
		// 					break
		// 				case 'closed':
		//
		// 					break
		// 				case 'repo':
		//
		// 					break
		// 				case 'groupBy':
		//
		// 					break
		// 				case 'sort':
		//
		// 					break
		// 				case 'sortDirection':
		//
		// 					break
		// 			}
		// 		})
		// 	})
		//
		// 	// this.viewController.setCriteria(updatedCriteria)
		// }
		
		
	}
	
	
	/**
	 * On escape sequence close the search
	 */
	private onSearchEscape = () => {
		log.info(`Search escape`)
		
		setTimeout(() => {
			getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
			
		}, 100)
		return true
	}
	
	
	render() {
		const
			{
				styles,
				open,
				criteria = {} as any,
				searchText
			} = this.props
		
		return !criteria ? React.DOM.noscript() : <SearchField
			
			searchId='issues-search'
			open={open}
			criteria={criteria}
			criteriaRenderer={this.criteriaRenderer}
			text={searchText || ""}
			onTextChanged={this.onSearchTextChanged}
			onItemSelected={this.onItemSelected}
			providers={[
				this.searchProvider
			]}
			inputStyle={styles.input}
			onEscape={this.onSearchEscape}
		/>
	}
	
}

export const IssuesPanelSearchKeywords = {
	groupKeywords: [ 'milestone', 'assignee', 'repo', 'label' ],
	sortKeywords: [ 'updated', 'created', 'repo', 'title', 'assignee' ],
	directionKeywords: [ 'asc', 'desc' ],
	closedKeywords: [ 'closed' ],
}

const Keywords = IssuesPanelSearchKeywords

/**
 * Search provider
 */
export class IssuesPanelSearchProvider implements ISearchProvider {
	
	static SortByKeywordToFields = {
		'updated': 'updated_at',
		'created': 'created_at',
		'assignee': 'assignee.login',
		'title': 'title',
		'repo': 'repoId'
	}
	
	
	static GroupByKeywordToFields = {
		'milestone': 'milestone',
		'assignee': 'assignee',
		'label': 'labels',
		'repo': 'repos'
	}
	
	constructor(private issuesSearchField:IssuesPanelSearch) {
		
	}
	
	id = 'IssuesPanelSearch'
	
	name = "Issue filters & sorting"
	
	/**
	 * Used by result list to render the item
	 *
	 * @param item - if item is null then results have not yet been loaded
	 * @param selected
	 * @return {any}
	 */
	render(item:ISearchItem, selected:boolean) {
		log.debug(`Render item`, item, 'selected', selected)
		return <IssuesPanelSearchItem
			item={item.value}
			selected={selected}
		/>
		
	}
	
	
	private closedMatched = (results:List<ISearchItem>, keyword:string, text:string) => {
		results.push(new SearchItem(`closed-true`, this, {
			id: 'includeClosed',
			type: 'includeClosed',
			field: true,
			label: 'includeClosed: true'
		}))
		
		return false
	}
	
	private directionMatched = (results:List<ISearchItem>, keyword:string, text:string) => {
		results.push(new SearchItem(`sortDirection-${keyword}`, this, {
			id: `sortDirection-${keyword}`,
			type: 'sortDirection',
			field: keyword,
			label: `sortDirection: ${keyword}`
		}))
		
		return false
	}
	
	private sortByMatched = (results:List<ISearchItem>, keyword:string, text:string) => {
		const
			sortBy = IssuesPanelSearchProvider.SortByKeywordToFields[ keyword ]
		
		results.push(new SearchItem(`sortBy-${sortBy}`, this, {
			id: `sortBy-${sortBy}`,
			type: 'sortBy',
			field: sortBy,
			label: `sortBy: ${keyword}`
		}))
	}
	
	private groupByMatched = (results:List<ISearchItem>, keyword:string, text:string) => {
		const
			groupBy = IssuesPanelSearchProvider.GroupByKeywordToFields[ keyword ]
		
		results.push(new SearchItem(`groupBy-${groupBy}`, this, {
			id: `groupBy-${groupBy}`,
			type: 'groupBy',
			value: groupBy,
			label: `groupBy: ${keyword}`
		}))
	}
	
	/**
	 * Match keywords and execute callback on each match
	 *
	 * @param results
	 * @param keywords
	 * @param text
	 * @param matchedFn
	 */
	matchKeywords(results:List<ISearchItem>,
	              keywords:string[],
	              text:string,
	              matchedFn:(results, keyword, text) => any) {
		const
			textParts = text.split(' ')
		
		for (let keyword of keywords) {
			if (textParts.some(part => new RegExp(part, "i").test(keyword))) {
				if (matchedFn(results, keyword, text) === false)
					return
			}
		}
	}
	
	
	private matchProps(results:List<ISearchItem>,
	                   items:List<any>,
	                   props:string[],
	                   clazz:IModelConstructor<any>,
	                   labelProp:string,
	                   text:string) {
		const
			textRegEx = new RegExp(text, "i"),
			type = clazz.$$clazz
		
		items.forEach(item => {
			if (props.some(prop => textRegEx.test(_.get(item, prop, '')))) {
				results.push(new SearchItem(`${type}-${item.id}`, this, {
					id: `${type}-${item.id}`,
					type,
					value: item,
					label: `${type.toLowerCase()}: ${_.get(item, labelProp)}`
				}))
			}
		})
	}
	
	/**
	 * Query for results
	 *
	 * @param criteria
	 * @param text
	 */
	async query(criteria, text):Promise<List<ISearchItem>> {
		
		const
			storeState = getStoreState(),
			{ viewController } = this.issuesSearchField,
			results = List<ISearchItem>().asMutable()
		
		// GET DATA
		const
			milestones = enabledMilestonesSelector(storeState),
			labels = enabledLabelsSelector(storeState),
			assignees = enabledAssigneesSelector(storeState),
			repos = enabledAvailableReposSelector(storeState)
		
		this.matchKeywords(results, Keywords.groupKeywords, text, this.groupByMatched)
		this.matchKeywords(results, Keywords.sortKeywords, text, this.sortByMatched)
		this.matchKeywords(results, Keywords.directionKeywords, text, this.directionMatched)
		this.matchKeywords(results, Keywords.closedKeywords, text, this.closedMatched)
		
		this.matchProps(results, assignees, [ 'name', 'login', 'email' ], User, 'login', text)
		this.matchProps(results, labels, [ 'name' ], Label, 'name', text)
		this.matchProps(results, milestones, [ 'title' ], Milestone, 'title', text)
		this.matchProps(results, repos, [ 'repo.full_name' ], Repo, 'repo.full_name', text)
		
		if (text && text.length) {
			results.push(new SearchItem(`text-${text}`, this, {
				id: `text-${text}`,
				type: 'text',
				value: text,
				label: `containsText: ${text}`
			}))
		}
		
		return results.asImmutable()
	}
}