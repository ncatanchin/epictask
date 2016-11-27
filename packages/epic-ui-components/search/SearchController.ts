import { List,Map } from "immutable"
import { AvailableRepo, Repo, SearchItem, SearchResult } from "epic-models"

import { getCommandManager, ICommand } from "epic-command-manager"
import { ValueCache, Benchmark ,cloneObjectShallow,EnumEventEmitter } from "epic-global"
import {  getRepoActions } from "epic-typedux/provider/ActionFactoryProvider"
import { isNumber, getValue, isFunction, isNil, isList } from "typeguard"
import { nilFilterList } from "epic-global/ListUtil"
import { SearchState } from "epic-ui-components/search/SearchState"
import { ViewStateEvent } from "epic-typedux/state/window/ViewState"
import { EventEmitter } from "events"

const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)


log.setOverrideLevel(LogLevel.DEBUG)



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
export class SearchController extends EventEmitter implements IViewController<SearchState> {
	

	
	private pendingSearch:Promise<void>
	
	private working:boolean
	
	private items:List<SearchItem>
	
	private state:SearchState
	
	
	makeStateUpdate<T extends Function>(updater:T):T {
		return null
	}
	
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
		super()
		
		this.state = new SearchState()
		
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
	
	
	/**
	 * Update/patch the current state
	 *
	 * @param patch
	 * @returns {any}
	 */
	updateState(patch:{[prop:string]:any}) {
		patch = cloneObjectShallow(patch)
		
		const
			keys = getValue(() => Object.keys(patch))
		
		
		if (!patch || !keys || !keys.length)
			return this.state
		
		const
			updatedState = this.state.withMutations(state => {
				for (let key of keys) {
					const
						newVal = patch[ key ]
					
					if (state.get(key) !== newVal)
						state = state.set(key, newVal)
				}
				
				return state
			}) as SearchState
		
		if (updatedState !== this.state) {
			
			this.state = updatedState
			log.tron(`Updated search state, focused=${updatedState.focused}`)
			this.emit(ViewStateEvent[ ViewStateEvent.Changed ],updatedState)
			this.emit(SearchEvent[SearchEvent.StateChanged],this.state)
		}
		
		return updatedState
	}
	
	private setResults(results:List<SearchResult>) {
		this.updateState({
			items: this.makeItems(results),
			results: results,
			working: false
		})
		return this.state
	}
	
	
	
	getState() {
		return this.state
	}
	
	/**
	 * Set providers
	 * @param providers
	 */
	setProviders(providers:TSearchProvider[]) {
		this.providers =  providers.map((it:any) => isFunction(it.query) ? it : new it()) as ISearchProvider[]
	}
	
	
	
	private setStarted() {
		this.updateState({
			working: true
		})
	}
	
	private setFinished() {
		this.updateState({
			working: false
		})
	}
	
	
	
	setSelectedIndex(index:number) {
		this.updateState({
			selectedIndex:index
		})
	}
	
	
	setFocused(focused:boolean) {
		this.updateState({focused})
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
		
		this.emit(SearchEvent[SearchEvent.ItemSelected],item)
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
