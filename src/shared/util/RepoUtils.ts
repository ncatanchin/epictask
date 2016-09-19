
import {Repo as TSRepo,FinderRequest} from 'typestore'
import {List} from 'immutable'
import { IModelConstructor } from "shared/Registry"

/**
 * Paged finder
 *
 * @param type
 * @param itemsPerPage
 * @param store
 * @param finderFn
 * @returns {List<T>}
 */
export async function pagedFinder<T,R extends TSRepo<any>>(
	type:{new():T},
	itemsPerPage:number,
	store:R,
  finderFn:(store:R,nextRequest:FinderRequest) => Promise<T[]>
):Promise<List<T>> {
		
	const
		allItems = []
	
	let
		moreAvailable = true,
		pageNumber = -1,
		itemCount = 0
	
	while (moreAvailable) {
		pageNumber++
		
		const
			nextRequest = new FinderRequest(itemsPerPage,pageNumber * itemsPerPage),
			moreItems = await finderFn(store,nextRequest)
		
		moreAvailable = moreItems.length >= itemsPerPage
		allItems.push(...moreItems)
		itemCount += allItems.length
		
		log.info(`Paging finder ${type.$$clazz} / page ${pageNumber} / ${moreItems.length} items on this page, more = ${moreAvailable} / total items so far ${itemCount}`)
	}
	
	return List<T>().push(...allItems)
}