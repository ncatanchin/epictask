// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { getIssuesPanelSelector, IssuesPanelController } from "epic-ui-components/pages/issues-panel"
import { colorAlpha } from "epic-styles/styles"
import { cloneObjectShallow } from "epic-global"
import { SearchPanel } from "epic-ui-components/search"
import { ContainerNames, getCommandManager } from "epic-command-manager"
import {
	enabledMilestonesSelector, enabledAvailableReposSelector,
	enabledAssigneesSelector, enabledLabelsSelector
} from "epic-typedux/selectors"
import { SearchItem, User, Label, Milestone, Repo } from "epic-models"
import { isString } from "typeguard"

const
	searchQueryParser = require('search-query-parser')

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexAuto,makePaddingRem(0, 1), {
		//backgroundColor: Transparent,
		borderBottom: `0.1rem solid ${primary.hue3}`,
		
		field: [ {
			//backgroundColor: Transparent
		} ],
		
		input: [ {
			backgroundColor: Transparent,
			color: text.secondary,
			borderBottom: `0.1rem solid ${colorAlpha(text.secondary,0.1)}`,
			fontWeight: 500,
			fontSize: themeFontSize(1.7),
			':focus': {
				
			}
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
	criteria: getIssuesPanelSelector(selectors => selectors.issueCriteriaSelector)
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
	
	
	/**
	 * Renderer criteria elements
	 *
	 * @param criteria
	 * @returns {Array}
	 */
	private criteriaRenderer = (criteria) => {
		
		return []
	}
	
	/**
	 * On text changed - let's see if we can parse some
	 * criteria
	 *
	 * @param newText
	 */
	private onSearchTextChanged = (newText) => {
		const
			{criteria} = this.props,
			opts = {
				keywords: ['label','milestone','assignee','groupBy','repo','closed','sort','sortDirection']
			},
			query = searchQueryParser.parse(newText,opts)
		
		let
			updatedCriteria = cloneObjectShallow(criteria),
			queryText = isString(query) ? query :
				isString(query.text) ? query.text :
					(newText || '')
		
		log.debug(`New search text`,newText,'parsed',query,'criteria',updatedCriteria,'viewController',this.viewController)
		
		// FIRST SET THE TEXT
		updatedCriteria.text = queryText
			
		
		if (queryText !== newText) {
			[false,true].forEach(exclude => {
				const
					keys = (exclude ? query.exclude : query)
						.filter(key => !['exclude','text'].includes(key))
				
				log.debug(`Updating criteria (exclude=${exclude}) with keys`,keys)
				
				keys.forEach(key => {
					key = key.toLowerCase()
					
					switch (key) {
						case 'label':
							
							break
						case 'milestone':
							
							break
						case 'assignee':
							
							break
						case 'closed':
							
							break
						case 'repo':
							
							break
						case 'groupBy':
							
							break
						case 'sort':
							
							break
						case 'sortDirection':
							
							break
					}
				})
			})
		}
		
		this.viewController.setCriteria(updatedCriteria)
		
		return false
	}
	
	
	/**
	 * On escape sequence close the search
	 */
	private onSearchEscape = () => {
		log.info(`Search escape`)
		
		setTimeout(() => {
			getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
			
		},100)
		return true
	}
	
	
	render() {
		const
			{
				styles,
				open,
				criteria = {} as any
			} = this.props
		
		return !criteria ? React.DOM.noscript() : <SearchPanel
			
			searchId='issues-search'
			open={open}
			criteria={criteria}
			criteriaRenderer={this.criteriaRenderer}
			text={criteria.text}
			onTextChanged={this.onSearchTextChanged}
			providers={[
				this.searchProvider
			]}
			inputStyle={styles.input}
			onEscape={this.onSearchEscape}
		/>
	}
	
}
/**
 * Search provider
 */
class IssuesPanelSearchProvider implements ISearchProvider {
	
	static SortByKeywordToFields = {
		'updated': 'updated_at',
		'created': 'created_at',
		'assignee':'assignee.login',
		'title': 'title',
		'repo': 'repoId'
	}
	
	
	static GroupByKeywordToFields = {
		'milestone': 'milestone',
		'assignee':'assignee',
		'label': 'labels',
		'repo': 'repos'
	}
	
	constructor(private issuesSearchPanel:IssuesPanelSearch) {
		
	}
	
	id = 'IssuesPanelSearch'
	
	name = "Issue filters & sorting"
	
	handleItem(item:ISearchItem) {
		
	}
	
	/**
	 * Used by result list to render the item
	 *
	 * @param item - if item is null then results have not yet been loaded
	 * @param selected
	 * @return {any}
	 */
	render(item:ISearchItem,selected:boolean) {
		
		return <div>{item.value.label}</div>
	}
	
	
	
	
	private closedMatched = (results:List<ISearchItem>,keyword:string,text:string) => {
		results.push(new SearchItem(`closed-true`,this,{
			type: 'includeClosed',
			field: true
		}))
		
		return false
	}
	
	private directionMatched = (results:List<ISearchItem>,keyword:string,text:string) => {
		results.push(new SearchItem(`direction-${keyword}`,this,{
			type: 'direction',
			field: keyword
		}))
		
		return false
	}
	
	private sortByMatched = (results:List<ISearchItem>,keyword:string,text:string) => {
		const
			sortBy = IssuesPanelSearchProvider.SortByKeywordToFields[keyword]
		
		results.push(new SearchItem(`sortBy-${sortBy}`,this,{
			type: 'groupBy',
			field: sortBy
		}))
	}
	
	private groupByMatched = (results:List<ISearchItem>,keyword:string,text:string) => {
		const
			groupBy = IssuesPanelSearchProvider.GroupByKeywordToFields[keyword]
		
		results.push(new SearchItem(`groupBy-${groupBy}`,this,{
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
	private matchKeywords(
		results:List<ISearchItem>,
		keywords:string[],
		text:string,
		matchedFn:(results,keyword,text) => any)
	{
		const
			textParts = text.split(' ')
		
		for (let keyword in keywords) {
			if (textParts.some(part => new RegExp(part,"i").test(keyword))) {
				if (matchedFn(results,keyword,text) === false)
					return
			}
		}
	}
	
	
	private matchProps(
		results:List<ISearchItem>,
		items:List<any>,
		props:string[],
		clazz:IModelConstructor<any>,
		labelProp:string,
		text:string
	) {
		const
			textRegEx = new RegExp(text,"i"),
			type = clazz.$$clazz
		
		items.forEach(item => {
			if (props.some(prop => textRegEx.test(_.get(item,prop,'')))) {
				results.push(new SearchItem(`${type}-${item.id}`,this,{
					type,
					value: item,
					label: `${type.toLowerCase()}: ${_.get(item,labelProp)}`
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
	async query(criteria,text):Promise<List<ISearchItem>> {
		
		const
			storeState = getStoreState(),
			{viewController} = this.issuesSearchPanel,
			results = List<ISearchItem>().asMutable()
		
		// GET DATA
		const
			groupKeywords = ['milestone','assignee','repo','label'],
			sortKeywords = ['updated','created','repo','title','assignee'],
			directionKeywords = ['asc','desc'],
			closedKeywords = ['closed'],
			
			milestones = enabledMilestonesSelector(storeState),
			labels = enabledLabelsSelector(storeState),
			assignees = enabledAssigneesSelector(storeState),
			repos = enabledAvailableReposSelector(storeState)
			
		this.matchKeywords(results,groupKeywords,text,this.groupByMatched)
		this.matchKeywords(results,sortKeywords,text,this.sortByMatched)
		this.matchKeywords(results,directionKeywords,text,this.directionMatched)
		this.matchKeywords(results,closedKeywords,text,this.closedMatched)
		
		this.matchProps(results,assignees,['name','login','email'],User,'login',text)
		this.matchProps(results,labels,['name'],Label,'name',text)
		this.matchProps(results,milestones,['title'],Milestone,'title',text)
		this.matchProps(results,repos,['repo.full_name'],Repo,'repo.full_name',text)
		
		return results.asImmutable()
	}
}