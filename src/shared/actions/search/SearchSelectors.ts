
import {Map} from 'immutable'
import {SearchKey, DataKey} from 'shared/Constants'
import {Search, SearchResult, SearchSource, SearchData} from 'shared/actions/search/SearchState'
import {DataState, DataResultsContainer} from 'shared/actions/data/DataState'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'


const searchesSelector = (state:any):Map<string,Search> => state.get(SearchKey).searches


const searchSelector = (state:any,props:any) => {
	const searchId:string = props.searchId
	return searchesSelector(state).get(searchId) || new Search({id:searchId})
}

const resultsSelector = (state:any,props:any) => {
	const searchId:string = props.searchId
	const search = searchesSelector(state).get(searchId)
	return ((!search) ?
		Map<SearchSource,SearchResult>() :
		search.results).toArray()
}


const createResultsDataSelector = () => (state:any,props:any):DataResultsContainer[] => {
	const dataState:DataState = state.get(DataKey)
	const searchId:string = props.searchId
	const search = searchesSelector(state).get(searchId)
	if (!search)
		return []

	const dataIds = search.results.map(searchResult => searchResult.dataId).toArray()
	return dataIds.map(dataId => {
		const request = dataState.requests.get(dataId)
		assert(request,`DataRequest for searchId ${searchId} does not exist`)

		const {fulfilled} = request

		return {
			id:dataId,
			request,
			fulfilled,
			models: (!fulfilled) ?
				[]:
				request.modelIds.map(modelId => (
					dataState.models
						.get(request.modelType)
						.get(modelId + '')
				))
		}
	})

}

export type SearchDataSelector = (state:any, props?:any) => SearchData


/**
 * Create a search results selector
 */
export function createSearchDataSelector():SearchDataSelector {
	return createDeepEqualSelector(
		searchSelector,
		resultsSelector,
		createResultsDataSelector(),

		// Computed value, array of SearchResult
		(search:Search,results:SearchResult[],resultsData:DataResultsContainer[]) => {

			return {
				search,
				results: results.map(result => {
					const data = resultsData.find(resultData => resultData.id === result.dataId)
					return {
						result,
						data
					}
				})
			}


		}
	)


}


export function createSearchItemSelector() {
	return createDeepEqualSelector(
		createSearchDataSelector(),
		(searchData:SearchData) => {
			return (!searchData) ? [] : searchData.results.reduce((items,nextResult) => {
				return items.concat(nextResult.result.items || [])
			},[])
		}
	)
}