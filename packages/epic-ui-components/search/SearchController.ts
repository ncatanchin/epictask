import { List,Map } from "immutable"
import { AvailableRepo, Repo, SearchItem, SearchResult } from "epic-models"

import { getCommandManager, ICommand } from "epic-command-manager"
import { ValueCache, Benchmark ,cloneObjectShallow,EnumEventEmitter } from "epic-global"
import {  getRepoActions } from "epic-typedux/provider/ActionFactoryProvider"
import { isNumber, getValue, isFunction, isNil, isList } from "typeguard"
import { nilFilterList } from "epic-global/ListUtil"


const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)


export interface ISearchState {
	items:List<SearchItem>
	results:List<SearchResult>
	working?:boolean
	selectedIndex:number
	controller:SearchController
}


export type TOnSearchSelectHandler = (item:SearchItem) => any

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
	
	private working:boolean
	
	private items:List<SearchItem>
	
	private state:ISearchState
	
	
	/**
	 * All search providers
	 */
	providers:ISearchProvider[]
	
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
	results = List<SearchResult>()
	
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
		
		this.updateState()
		
	}
	
	/**
	 * Flatten all items in a result set
	 *
	 * @param results
	 * @returns {SearchItem[]}
	 */
	private makeItems(results = List<SearchResult>()):List<SearchItem> {
		return results
			.reduce((allItems,result) => {
				const
					{perSourceLimit} = this
				
				let
					{items} = result
				
				if (isList(items))
					items = (!perSourceLimit || perSourceLimit < 1 || result.items.size <= perSourceLimit) ?
						items :
						items.slice(0,perSourceLimit) as List<SearchItem>
					
				return allItems.concat(items) as List<SearchItem>
			},List<SearchItem>())
	}
	
	
	private updateState() {
		this.state = {
			items: this.makeItems(this.results),
			results: this.results,
			controller: this,
			working: this.working,
			selectedIndex: isNumber(this.selectedIndex) ? this.selectedIndex : 0
		}
		this.fireEvent(SearchEvent.StateChanged,this.state)
		return this.state
	}
	
	
	
	getState() {
		return this.state || this.updateState()
	}
	
	/**
	 * Set providers
	 * @param providers
	 */
	setProviders(providers:TSearchProvider[]) {
		this.providers =  providers.map((it:any) => isFunction(it.query) ? it : new it()) as ISearchProvider[]
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
	private setResults(results:List<SearchResult>) {
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
	
	
	
	/**
	 * Update the query
	 */
	setQuery = _.debounce((criteria,text:string) => {
		this.queryCache.set({criteria,text})
	},250)
	
	
	/**
	 * Execute the search
	 *
	 * @param criteriaAndText
	 * @return {undefined}
	 */
	private async runSearch(criteriaAndText) {
		const
			{text,criteria} = criteriaAndText
		
		log.info(`Running search with query: ${text}`)
		
		const nextSearch = () => {
			this.pendingSearch = (criteriaAndText !== this.queryCache.get()) ?
				this.runSearch(this.queryCache.get()) :
				null
		}
		
		if (!this.allowEmptyQuery && (!text || !text.length)) {
			return nextSearch()
		}
		
		this.setStarted()
		
		try {
			let
				results = List(this.providers.map(provider => new SearchResult(this.searchId,provider,criteria,text)))
			
			this.setResults(results)
			
			const
				{searchId} = this,
				searchPromises = results.map(async (result,index) => {
					const
						items = await result.provider.query(criteria, text)
					
					result.resolve(items)
					
					results = this.results.set(index,cloneObjectShallow(result))
					this.setResults(results)
				})
			
			
			log.debug(`Waiting for all type searches to return: ${searchId}`)
			await Promise.all(searchPromises.toArray())
			
			log.debug(`Got Results for ${text}`,results)
			log.info(`Results`)
			this.setResults(nilFilterList(results as any))
			
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
