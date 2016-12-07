import {List} from 'immutable'
import { isNil, getValue } from "typeguard"
import { cloneObjectShallow } from "epic-global"



/**
 * Export the types and interfaces required
 */
declare global {
	
	/**
	 * Interface for search items
	 */
	interface ISearchItem extends SearchItem {
		
	}
	
	/**
	 * The interface for a provider to implement
	 */
	interface ISearchProvider {
		readonly id:string
		readonly name:string
		
		
		handleItem?:(item:ISearchItem) => any
		
		/**
		 * Used by result list to render the item
		 *
		 * @param item - if item is null then results have not yet been loaded
		 */
		render?:(item?:ISearchItem,selected?:boolean) => React.ReactElement<any>
		
		/**
		 * Query for results
		 *
		 * @param criteria
		 * @param text
		 */
		query:(criteria,text) => Promise<List<ISearchItem>>
	}
	
	
	
	interface ISearchProviderConstructor {
		new ():ISearchProvider
	}
	
	type TSearchProvider = ISearchProvider|ISearchProviderConstructor
}


export class SearchItem {
	
	static fromJS(o:any) {
		return new SearchItem(o)
	}
	
	id:string|number
	provider:ISearchProvider
	providerResultIndex:number
	score:number
	value:any
	component:React.ReactElement<any>
	
	
	constructor(id:string|number, provider:ISearchProvider, value, score?:number)
	constructor(obj:any)
	constructor(idOrObject:any, provider:ISearchProvider = null, value = null, score:number = 1) {
		if (_.isNumber(idOrObject) || _.isString(idOrObject)) {
			assign(this, {
				id: idOrObject,
				provider,
				score,
				value
			})
		} else {
			assign(this, idOrObject)
		}
		
	}
}


/**
 * Search Result
 */
export class SearchResult {
	
	private deferred = Promise.defer<List<SearchItem>>()

	get isResolved() {
		return this.deferred.promise.isResolved()
	}
	
	get size() {
		return getValue(() => this.items.size,0)
	}

	get items():List<SearchItem> {
		return getValue(() => this.deferred.getResult(),List<SearchItem>())
	}
	
	/**
	 * New SearchResult
	 *
	 * @param criteria
	 * @param text
	 * @param searchId
	 * @param provider
	 */
	constructor(public searchId:string,public provider:ISearchProvider,public criteria:any, public text:string) {
		
	}
	
	/**
	 * Set the resolved items - NOTE: this object is immutable,
	 * this will return a new ref
	 *
	 * @param items
	 * @returns {SearchResult}
	 */
	resolve(items:List<SearchItem>) {
		return this.deferred.resolve(items)
	}
}
