import { List } from "immutable"
import { SearchItem, SearchResult } from "epic-models"
import { cloneObjectShallow, shallowEquals } from "epic-global"
import { getValue, isFunction, isList } from "typeguard"
import { SearchState } from "./SearchState"
import { View, viewsSelector } from "epic-typedux"
import { createSelector } from "reselect"
import { StoreViewController } from "epic-ui-components/layout/view"
import { Benchmark, ValueCache, nilFilterList } from "epic-util"
import * as ReactDOM from "react-dom"

const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)

//log.setOverrideLevel(LogLevel.DEBUG)



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
export class SearchController extends StoreViewController<SearchState> {
	

	
	private pendingSearch:Promise<void>
	
	private working:boolean
	
	private items:List<SearchItem>
	
	
	
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
	perProviderLimit:number = -1
	
	searchId:string
	
	
	
	
	constructor(id:string,initialState = new SearchState,opts) {
		super(id,initialState,opts)
		
		this.queryCache = new ValueCache((newValue,oldValue) => {
			if (!this.pendingSearch)
				this.pendingSearch = this.runSearch(newValue)
			
		},true)
		
	}
	
	/**
	 * Ensure selected item index is visible
	 *
	 * @type {(())&_.Cancelable}
	 */
	ensureItemVisible = _.debounce((item) => {
		try {
			(ReactDOM.findDOMNode(item) as any).scrollIntoViewIfNeeded()
		} catch (err) {
			//log.error(`Failed to scroll into view`,err)
		}
	},150)
	
	/**
	 * Flatten all items in a result set
	 *
	 * @param results
	 * @returns {SearchItem[]}
	 */
	private makeItems(results = List<SearchResult>()):List<SearchItem> {
		const items = results
			.reduce((allItems,result) => {
				if (!result)
					return allItems
				
				const
					{perProviderLimit} = this
				
				let
					{items} = result
				
				if (isList(items))
					items = (!perProviderLimit || perProviderLimit < 1 || result.items.size <= perProviderLimit) ?
						items :
						items.slice(0,perProviderLimit) as List<SearchItem>
					
				return allItems.concat(items) as List<SearchItem>
			},List<SearchItem>())
			
			// FINALLY sort the items by provider and score
			.sortBy(item => {
				const
					{provider,score} = item,
					providerIndex = this.providers.findIndex(it => it.id === provider.id),
					sortKey = `${providerIndex}|||${score}`
				
				log.debug(`item sortkey=${sortKey}`)
				return sortKey
			}) as List<SearchItem>
		
		let
			lastProvider,
			providerIndex
		
		// Finally index the items within each provider set
		items.forEach(item => {
			if (!lastProvider || lastProvider !== item.provider) {
				lastProvider = item.provider
				providerIndex = -1
			}
			
			providerIndex++
			item.providerResultIndex = providerIndex
			
		})
		
		return items
	}
	
	//
	// /**
	//  * Update/patch the current state
	//  *
	//  * @param patch
	//  * @returns {any}
	//  */
	// updateState(patch:{[prop:string]:any}) {
	// 	const
	// 		updatedState = super.updateState(patch)
	//
	// 	//this.emit(ViewEvent[ ViewEvent.Changed ],updatedState)
	//
	// 	return updatedState
	// }
	
	private setResults(results:List<SearchResult>) {
		let
			items = this.makeItems(results),
			currentItems = getValue(() => this.state.items)
		
		
		if (currentItems && getValue(() => _.isEqual(items.toJS(),currentItems.toJS()),false)) {
			items = currentItems
		}
		
		log.debug(`Updating results`,results, 'view id',this.id)
		
		return this.updateState({
			items,
			results,
			working: false
		})
		
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
	
	
	private criteriaAndText = null
	/**
	 * Update the query
	 */
	setQuery = _.debounce((criteria,text:string) => {
		log.tron(`Setting search text ${text} and criteria`,criteria)
		
		const
			newCriteriaText = {criteria,text},
			changed = !_.isEqual(newCriteriaText,this.criteriaAndText)//!shallowEquals(newCriteriaText,text)
		
		log.tron(`Criteria and text changed=${changed}`,newCriteriaText)
		if (changed) {
			this.criteriaAndText = newCriteriaText
			
			if (this.pendingSearch) {
				log.tron(`Search is pending - returning`)
				return
			}
			
			this.runSearch(newCriteriaText)
		}
		
		
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
		
		log.debug(`Running search with query: ${text}`)
		
		
		
		const nextSearch = () => {
			this.pendingSearch = (criteriaAndText !== this.criteriaAndText) ?
				this.runSearch(this.criteriaAndText) :
				null
		}
		
		
		if (!this.allowEmptyQuery && (!text || !text.length)) {
			log.debug(`Not running search text=${text} allow empty = ${this.allowEmptyQuery}`)
			this.setResults(List<SearchResult>())
			return nextSearch()
		}
		
		this.setStarted()
		
		try {
			let
				results = List(this.providers.map(provider =>
					new SearchResult(this.searchId,provider,criteria,text))).asMutable()
			
			this.setResults(results.asImmutable())
			
			const
				{searchId} = this,
				searchPromises = results.map(async (result,index) => {
					const
						items = await result.provider.query(criteria, text)
					
					result.resolve(items)
					
					results.set(index,cloneObjectShallow(result))
					this.setResults(results.asImmutable())
				})
			
			
			log.debug(`Waiting for all type searches to return: ${searchId}`)
			await Promise.all(searchPromises.toArray())
			
			log.debug(`Got Results for ${text}`,results)
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
		
	}
	
	
	static makeSearchStateSelector() {
		const
			viewSelector = createSelector(
				viewsSelector,
				(state,props) => props.viewController.id,
				(views:List<View>,viewId:string) => views.find(it => it.id === viewId)
			)
		
		return createSelector(
			viewSelector,
			(view:View) => view.state as SearchState
		)
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
