
import {Repo as TSRepo,FinderRequest} from 'typestore'
import {List} from 'immutable'
import { IModelConstructor } from "shared/Registry"

const
	log = getLogger(__filename)

/**
 * Paged finder
 *
 * @param type
 * @param itemsPerPage
 * @param store
 * @param finderFn
 * @returns {List<T>}
 */
export function pagedFinder<T,R extends TSRepo<any>>(
	type:{new():T},
	itemsPerPage:number,
	store:R,
  finderFn:(store:R,nextRequest:FinderRequest,results?:T[]) => Promise<T[]>
):Promise<List<T>> {
		
	const
		allItems = [],
		deferred = Promise.defer()
	
	let
		lastItems = null,
		moreAvailable = true,
		pageNumber = -1,
		itemCount = 0
	
	const getNextPage = () => {
		pageNumber++
		
		const
			nextRequest = new FinderRequest(itemsPerPage,pageNumber * itemsPerPage)
		
		try {
			finderFn(store, nextRequest,lastItems)
				.then(moreItems => {
					let
						moreAvailable = moreItems.length >= itemsPerPage
					
					lastItems = moreItems
					allItems.push(...moreItems)
					itemCount += allItems.length
					
					log.debug(`Paging finder ${type.$$clazz} / page ${pageNumber} / ${moreItems.length} items on this page, more = ${moreAvailable} / total items so far ${itemCount}`)
					
					if (moreAvailable) {
						setTimeout(getNextPage, 1)
					} else {
						deferred.resolve(List<T>().push(...allItems))
					}
				})
				.catch(err => {
					log.error(`Paging finder error`, err)
					deferred.reject(err)
				})
		} catch (err) {
			log.error(`Paged finder failed`,err)
			deferred.reject(err)
		}
		
	}
	
	getNextPage()
	
	return deferred.promise
}