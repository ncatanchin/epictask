import { List } from "immutable"
import { FinderRequest, FinderResultArray } from "typestore"
import { RepoStore, AvailableRepo, Repo, Issue, Label, Milestone, User } from "epic-models"
import { getStores } from "epic-database-client"

import {
	enabledLabelsSelector,
	enabledMilestonesSelector,
	enabledAssigneesSelector
} from "epic-typedux/selectors/RepoSelectors"

import { GitHubClient, createClient } from "epic-github"
import { getCommandManager, ICommand } from "epic-command-manager"
import { ValueCache, Benchmark ,cloneObjectShallow,EnumEventEmitter } from "epic-global"
import {  getRepoActions } from "epic-typedux/provider/ActionFactoryProvider"


const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)







export enum SearchType {
	Issue = 1,
	Assignee,
	Repo,
	AvailableRepo,
	Milestone,
	Label,
	Action
}


export enum SearchSource {
	Issue = 1,
	Assignee,
	Repo,
	GitHub,
	AvailableRepo,
	Milestone,
	Label,
	Action
}

export const SearchTypeSourceMap = {
	[SearchType.Assignee]: [SearchSource.Assignee],
	[SearchType.Issue]: [SearchSource.Issue],
	[SearchType.Repo]: [SearchSource.Repo,SearchSource.GitHub],
	[SearchType.AvailableRepo]: [SearchSource.AvailableRepo],
	[SearchType.Label]: [SearchSource.Label],
	[SearchType.Milestone]: [SearchSource.Milestone],
	[SearchType.Action]: [SearchSource.Action]
}

export const SearchSourceTypeMap = {
	[SearchSource.Assignee]:SearchType.Assignee,
	[SearchSource.Issue]:SearchType.Issue,
	[SearchSource.Repo]:SearchType.Repo,
	[SearchSource.GitHub]:SearchType.Repo,
	[SearchSource.AvailableRepo]:SearchType.AvailableRepo,
	[SearchSource.Milestone]:SearchType.Milestone,
	[SearchSource.Label]:SearchType.Label,
	[SearchSource.Action]:SearchType.Action
	
}

export class SearchItem {
	
	static fromJS(o:any) {
		return new SearchItem(o)
	}
	
	id:string|number
	type:SearchType
	score:number
	value:any
	
	
	constructor(id:string|number,type:SearchType,value,score:number)
	constructor(obj:any)
	constructor(idOrObject:any, type:SearchType = null,value = null,score:number = 1) {
		if (_.isNumber(idOrObject) || _.isString(idOrObject)) {
			Object.assign(this, {
				id: idOrObject,
				type,
				score,
				value
			})
		} else {
			Object.assign(this, idOrObject)
		}
		
	}
}

/**
 * Search Result
 */
export class SearchResult {
	
	static fromJS(o:any) {
		if (o && o instanceof SearchResult)
			return o
		
		return new SearchResult(o)
	}
	
	items:List<SearchItem>
	type:SearchType
	source:SearchSource
	dataId:string
	searchId:string
	
	constructor(searchId:string,items:List<SearchItem>,type:SearchType, source:SearchSource,count:number,total:number)
	constructor(obj:any)
	constructor(
		searchIdOrObject:any,
		items:List<SearchItem> = List<SearchItem>(),
		type:SearchType = null,
		source:SearchSource = null,
		public count:number = -1,
		public total:number = -1
	) {
		if (_.isString(searchIdOrObject)) {
			Object.assign(this,{
				searchId: searchIdOrObject,
				items,
				type,
				source
			})
		} else {
			const obj = searchIdOrObject,
				baseItems = (obj.items && Array.isArray(obj.items) || List.isList(obj.items)) ?
					_.toJS(obj.items) :
					[]
			
			const newItems = baseItems.map(item => SearchItem.fromJS(item))
			
			Object.assign(this,obj,{items:newItems})
		}
		
		this.dataId = this.dataId || `${this.searchId}-${this.source}`
	}
	
}

export interface ISearchState {
	items:List<SearchItem>
	results:SearchResult[]
	working?:boolean
	selectedIndex:number
	controller:SearchController
}


export type TOnSearchSelectHandler = (item:SearchItem) => any

/**
 * Text filter a series of objects, by specific props
 *
 * @param query
 * @param items
 * @param props
 * @param limit
 * @returns {any[]}
 */
function textSearchFilter(query:string,items:List<any>,props:string[], limit:number = 4) {

	query = _.toLower(query)

	let matchCount = 0
	
	return List(items.filter(item => {
		if (limit !== -1 && matchCount > limit)
			return false

		const
			text = _.toLower(props.map(prop => _.get(item,prop,'')).join(' ')),
			match = text.indexOf(query) > -1
		
		if (match)
			matchCount++

		return match
	}))
}

export enum SearchEvent {
	Started = 1,
	Finished,
	StateChanged,
	ItemSelected
}

export type TSearchListener = (...args:any[]) => void


/**
 * Handle search selection
 */
export type TSearchSelectHandler = (searchId:string,item:SearchItem) => any

/**
 * Search provider
 *
 * TODO: Redesign this
 */
export class SearchController extends EnumEventEmitter<SearchEvent> {
	

	
	private pendingSearch:Promise<void>
	
	private searchTypes:SearchType[] = []
	
	
	private working:boolean
	
	private items:List<SearchItem>
	
	private state:ISearchState
	/**
	 * Will an empty query return results (for things like actions)
	 *
	 * @type {boolean}
	 */
	allowEmptyQuery = false
	
	/**
	 * Query string cache change listener
	 */
	
	queryCache:ValueCache
	
	/**
	 * Current result lists
	 */
	results:SearchResult[] = []
	
	/**
	 * Keeps track of the selected index
	 */
	selectedIndex:number
	
	/**
	 * Listener map
	 */
	listenerMap:{[eventType:string]:TSearchListener[]} = {}
	
	/**
	 * Per source limit
	 *
	 * @type {number}
	 */
	perSourceLimit:number = -1
	
	
	searchId:string
	
	constructor() {
		super(SearchEvent)
		
		// if (!searchId)
		// 	throw new Error(`Search id can not be null`)
		//
		this.queryCache = new ValueCache((newValue,oldValue) => {
			if (!this.pendingSearch)
				this.pendingSearch = this.runSearch(newValue)
			
		})
		
	}
	
	/**
	 * Flatten all items in a result set
	 *
	 * @param results
	 * @returns {SearchItem[]}
	 */
	private makeItems(results:SearchResult[] = []):List<SearchItem> {
		return results.reduce((allItems,result) => {
			const
				{perSourceLimit} = this
			
			let
				{items} = result
			
			items = (!perSourceLimit || perSourceLimit < 1 || result.items.size <= perSourceLimit) ?
				items :
				items.slice(0,perSourceLimit) as List<SearchItem>
			
			return allItems.concat(items) as List<SearchItem>
		},List<SearchItem>())
	}
	
	
	private updateState() {
		this.state = {
			items: this.makeItems(this.results),
			results: this.results || [],
			controller: this,
			working: this.working,
			selectedIndex: this.selectedIndex
		}
		this.fireEvent(SearchEvent.StateChanged,this.state)
		return this.state
	}
	
	
	
	getState() {
		return this.state || this.updateState()
	}
	
	/**
	 * Fire an event to all listeners
	 *
	 * @param event
	 * @param args
	 */
	private fireEvent(event:SearchEvent,...args:any[]) {
		this.emit(event,...args)
	}
	
	/**
	 * Update the results and notify
	 *
	 * @param results
	 */
	private setResults(results:SearchResult[]) {
		this.results = results
		this.updateState()
		
	}
	
	
	private setStarted() {
		this.working = true
		this.updateState()
	}
	
	private setFinished() {
		this.working = false
		this.updateState()
	}
	
	
	
	setSelectedIndex(index:number) {
		this.selectedIndex = index
		this.updateState()
	}
	
	setTypes(...searchTypes:SearchType[]) {
		this.searchTypes = searchTypes
	}
	
	
	/**
	 * Update the query
	 */
	setQuery = _.debounce((query:string) => {
		this.queryCache.set(query)
	},250)
	
	
	mapResultsToSearchItems(idProperty:string,results:FinderResultArray<any>) {
		const md = results.itemMetadata
		return List<SearchItem>(results.map((item,index) => {
			const score = (md && md.length > index && md[index]) ?
				md[index].score : null

			return new SearchItem(item[idProperty],SearchType.Repo,item,score || 1)
		}))
	}
	
	/**
	 * Search repos
	 *
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchRepos(query:string):Promise<SearchResult> {
		const repoStore:RepoStore = getStores().repo

		const results = await repoStore.findWithText(new FinderRequest(4),query)
		log.info(`Found repos`,results)
		
		return new SearchResult(
			this.searchId,
			this.mapResultsToSearchItems('id',results),
			SearchType.Repo,
			SearchSource.Repo,
			results.length,
			results.total
		)


	}
	
	
	/**
	 * Search github
	 *
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchGitHub(query:string):Promise<SearchResult> {
		
		
		let
			items = List<SearchItem>()
		
		if (query && query.length > 3) {
			try {
				const
					repoStore:RepoStore = getStores().repo,
					client:GitHubClient = createClient(),
					results = await client.searchRepos(`fork:false ${query}`)
				
				for (let repo of results.items) {
					if (!repo.id)
						continue
					
					const
						existingRepo = await repoStore.get(repo.id)
					
					if (existingRepo) {
						repo = cloneObjectShallow(existingRepo,repo)
					}
					
					
					await repoStore.save(repo)
					
					
					items = items.push(
						new SearchItem(repo.id,SearchType.Repo,repo,(repo as any).score || 1)
					) as any
				}

				
			} catch (err) {
				log.info('Repo with explicitly name not found',err)
			}
		}
		
	
		return new SearchResult(
			this.searchId,
			items,
			SearchType.Repo,
			SearchSource.GitHub,
			items.size,
			items.size
		)
	}
	
	
	/**
	 * Search issues
	 *
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchIssues(query:string):Promise<SearchResult> {
		
		// const
		// 	issueState = getIssueActions().state,
		// 	issues = issueState.issues
		// 		.filter(issue =>
		// 			[issue.title,issue.body,issue.user.login,issue.user.name]
		// 					.join(' ').toLowerCase().indexOf(query.toLowerCase()) > -1
		// 		)
		//
		//

		// return new SearchResult(
		// 	this.searchId,
		// 	issues.map(issue => new SearchItem(issue.id,SearchType.Issue,issue,1)) as List<SearchItem>,
		// 	SearchType.Issue,
		// 	SearchSource.Issue,
		// 	issues.size,
		// 	issues.size
		// )
		return null

	}
	@Benchmarker
	async searchAssignees(query:string):Promise<SearchResult> {
		const
			assignees = enabledAssigneesSelector(getStoreState()),
			items = textSearchFilter(
				query,
				assignees,
				['name','login']
			)
		
		
		return new SearchResult(
			this.searchId,
			items.map(item => new SearchItem(item.id,SearchType.Assignee,item,1)) as List<SearchItem>,
			SearchType.Assignee,
			SearchSource.Assignee,
			items.size,
			items.size
		)
	}
	
	
	
	@Benchmarker
	async searchMilestones(query:string):Promise<SearchResult> {
		const
			milestones = enabledMilestonesSelector(getStoreState()),
			items = textSearchFilter(
				query,
				milestones,
				['title','description','creator.name','creator.login']
			)


		return new SearchResult(
			this.searchId,
			items.map(item => new SearchItem(item.id,SearchType.Milestone,item,1)) as List<SearchItem>,
			SearchType.Milestone,
			SearchSource.Milestone,
			items.size,
			items.size
		)
	}
	
	@Benchmarker
	async searchLabels(query:string):Promise<SearchResult> {
		const
			labels = enabledLabelsSelector(getStoreState()),
			items = textSearchFilter(
				query,
				labels,
				['name']
			)


		return new SearchResult(
			this.searchId,
			items.map(item => new SearchItem(item.url,SearchType.Label,item,1)) as List<SearchItem>,
			SearchType.Label,
			SearchSource.Label,
			items.size,
			items.size
		)
	}
	
	/**
	 * Search available repos
	 *
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchAvailableRepos(query:string):Promise<SearchResult> {
		
		//TODO: Implement search for available repos

		return new SearchResult(
			this.searchId,
			List<SearchItem>(),
			SearchType.AvailableRepo,
			SearchSource.AvailableRepo,
			0,
			0
		)
	}
	
	
	/**
	 * Find all matched actions
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchActions(query:string):Promise<SearchResult> {
		const
			allCommands = getCommandManager().allCommands()
		
		let
			results = List<ICommand>()
		
		if (query && query.length) {
			query = _.toLower(query || '')
			
			results = results.withMutations(tmpResults => {
				
				function findCommands(fuzzy:boolean) {
					for (let cmd of allCommands) {
						const
							name = _.toLower(cmd.name),
							index = name.indexOf(query)
						
						
						if ((fuzzy && index > -1) || (!fuzzy && index === 0)) {
							tmpResults.push(cmd)
						}
					}
				}
				
				// FIND EXACT
				findCommands(false)
				
				// IF NO EXACT MATCHES, GO FUZZY
				if (!tmpResults.size)
					findCommands(true)
				
				return tmpResults
			})
		} else {
			results = results.push(...allCommands)
		}
		
		return new SearchResult(
			this.searchId,
			
			results
				.map(cmd =>
					new SearchItem(cmd.id,SearchType.Action,cmd,1)
				) as List<SearchItem>,
			
			SearchType.Action,
			SearchSource.Action,
			results.size,
			results.size
		)
	}

	/**
	 * All Search functions mapped
	 * by source type
	 *
	 */
	private searchFns:{[key:number]:(query:string) => SearchResult} = {
		[SearchSource.GitHub]: this.searchGitHub,
		[SearchSource.Repo]: this.searchRepos,
		[SearchSource.Issue]: this.searchIssues,
		[SearchSource.AvailableRepo]: this.searchAvailableRepos,
		[SearchSource.Label]: this.searchLabels,
		[SearchSource.Assignee]: this.searchAssignees,
		[SearchSource.Milestone]: this.searchMilestones,
		[SearchSource.Action]: this.searchActions
	} as any

	/**
	 * Execute a specific search type
	 *
	 * @param query
	 * @param source
	 * @returns {Promise<SearchResult>}
	 */
	async searchType(query:string,source:SearchSource):Promise<SearchResult> {
		return await this.searchFns[source].call(this,query)
	}
	
	/**
	 * Execute the search
	 *
	 * @param query
	 */
	private async runSearch(query:string) {
		log.info(`Running search with query: ${query}`)
		
		const nextSearch = () => {
			this.pendingSearch = (query !== this.queryCache.get()) ?
				this.runSearch(this.queryCache.get()) :
				null
		}
		
		if (!this.allowEmptyQuery && (!query || !query.length)) {
			return nextSearch()
		}
		
		this.setStarted()
		
		try {
			const
				{searchId} = this,
				sources = this.searchTypes
					.reduce((sources,nextType) => sources
						.concat(SearchTypeSourceMap[nextType]),[]),
				searchPromises = sources.map(source => this.searchType(query, source))
			
			
			log.debug(`Waiting for all type searches to return: ${searchId}`)
			const
				results = await Promise.all(searchPromises)
			
			log.debug(`Got Results for ${query}`,results)
			log.info(`Results`)
			this.setResults(results)
			
		} catch (err) {
			log.error(`Search failed`,err)
		} finally {
			this.setFinished()
		}
		
		
		nextSearch()
		
			
		
		
		
				

	}
	
	
	
	
	/**
	 * Select a search result
	 *
	 * @param item
	 * @returns {(dispatch:any, getState:any)=>Promise<any>}
	 */
	select(item:SearchItem) {
		
		this.emit(SearchEvent.ItemSelected,item)
		EventHub.emit(EventHub.SearchItemSelected,this.searchId,item)
		// const
		// 	handler = getSearchSelectHandler(item.type)
		//
		// handler(searchId,item)
		
	}
	

}

export default SearchController


// if (module.hot) {
//
// 	const hotInstances =_.get(module,'hot.data.instances')
// 	if (hotInstances)
// 		Object
// 			.keys(hotInstances)
// 			.forEach(searchId => {
// 				const
// 					instance = hotInstances[searchId],
// 					newProvider = new SearchProvider(instance.handler.searchId)
//
// 				assign(newProvider,_.pick(instance.target,'listenerMap','queryCache','results'))
//
// 				// Update the proxy
// 				instance.setTargets(SearchProvider,newProvider)
//
// 				// Add it back to the new map
// 				instances[instance.searchId] = instance
// 			})
//
// 	module.hot.dispose((data:any) => {
// 		assign(data,{
// 			instances
// 		})
// 	})
// 	module.hot.accept(() => log.info('hot reload',__filename))
// }


export namespace SearchController {
	
//
// 	/**
// 	 * Clone the current issue filter
// 	 *
// 	 * @returns {IIssueFilter} - deep copied
// 	 */
// 	function newIssueFilter() {
// 		return cloneObject(getIssueActions().state.issueFilter)
// 	}
//
// 	[SearchType.Issue]: (searchId:string, item:SearchItem) => {
// 	const
// 		model = item.value
//
// 	assert(model.$$clazz === Issue.$$clazz)
// 	getIssueActions().setSelectedIssueIds([ model.id ])
// },
// 	[SearchType.Assignee]: (searchId:string, item:SearchItem) => {
// 	const
// 		user:User = item.value,
// 		newFilter = newIssueFilter()
//
// 	let
// 		assigneeIds = newFilter.assigneeIds || (newFilter.assigneeIds = [])
//
// 	if (assigneeIds.includes(user.id))
// 		return
//
// 	assigneeIds.push(user.id)
// 	getIssueActions().setFilteringAndSorting(newFilter)
// },
// 	[SearchType.Label]: (searchId:string, item:SearchItem) => {
// 	const
// 		newFilter = newIssueFilter(),
// 		label:Label = item.value,
// 		labelUrls = newFilter.labelUrls || (newFilter.labelUrls = []),
// 		labelIndex = labelUrls.indexOf(label.url)
//
// 	if (labelIndex === -1)
// 		labelUrls.push(label.url)
// 	else
// 		labelUrls.splice(labelIndex, 1)
//
// 	getIssueActions().setFilteringAndSorting(newFilter)
// },
// 	[SearchType.Milestone]: (searchId:string, item:SearchItem) => {
// 	const
// 		newFilter = newIssueFilter(),
// 		milestone:Milestone = item.value,
// 		milestoneIds = newFilter.milestoneIds || (newFilter.milestoneIds = []),
// 		milestoneIndex = milestoneIds.indexOf(milestone.id)
//
// 	if (milestoneIndex === -1)
// 		milestoneIds.push(milestone.id)
// 	else
// 		milestoneIds.splice(milestoneIndex, 1)
//
// 	getIssueActions().setFilteringAndSorting(newFilter)
// },
	
	/**
	 * All current handlers
	 */
	export const DefaultHandlers:{[searchType:number]:TSearchSelectHandler} = {
		[SearchType.AvailableRepo]: (searchId:string, item:SearchItem) => {
			const
				model = item.value
			
			assert(model.$$clazz === AvailableRepo.$$clazz)
			getRepoActions().setRepoEnabled(model, !model.enabled)
		},
		[SearchType.Repo]: (searchId:string, item:SearchItem) => {
			const
				model = item.value
			
			assert(model.$$clazz === Repo.$$clazz)
			getRepoActions().createAvailableRepo(model)
		},
		
		[SearchType.Action]: (searchId:string, item:SearchItem) => {
			const
				cmd = item.value as ICommand
			
			log.debug(`Selected action (${cmd.id}), executing`)
			cmd.execute(cmd)
		}
		
	}
	
	/**
	 * Get a search select handler
	 *
	 * @param type
	 * @returns {TSearchSelectHandler}
	 */
	export function getDefaultHandler(type:SearchType):TSearchSelectHandler {
		return DefaultHandlers[ type ]
	}
}