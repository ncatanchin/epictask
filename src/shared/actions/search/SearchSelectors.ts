
import {Map} from 'immutable'
import {createSelector} from 'reselect'
import {SearchKey, DataKey} from 'shared/Constants'
import {
	Search, SearchResult, SearchSource, SearchData, SearchItem, SearchType,
	SearchResultData, ISearchItemModel
} from 'shared/actions/search/SearchState'
import {DataState, DataResultsContainer} from 'shared/actions/data/DataState'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {repoModelsSelector} from 'shared/actions/data/DataSelectors'


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

/**
 * Aggregate all search items
 *
 * @returns {any}
 */
export function createSearchItemSelector() {
	return createDeepEqualSelector(
		createSearchDataSelector(),
		(searchData:SearchData) => {
			let allItems = (!searchData) ? [] : searchData.results.reduce((items,nextResult) => {
				return items.concat(nextResult.result.items || [])
			},[])

			// Filter out non `Repo` first
			const allModels = searchData.results.reduce((map,nextResultData:SearchResultData) => {
				nextResultData.result.items.forEach((item,index) => {
					map[item.id] = nextResultData.data.models[index]
				})
				return map
			},{})

			allItems = allItems
				.filter((item:SearchItem,index) => {
					if (!allModels[item.id]) {
						return false
					}

					if (item.type === SearchType.Repo)
						return true

					const otherItem = allItems.find((item2,item2Index:number) => item2.id === item.id && index !== item2Index)
					return (otherItem && otherItem.type === SearchType.Repo) ? false : true
				})

			// Unique filter by id
			return _.uniqBy(allItems,'id')
		}
	)
}

export function createSearchItemModelsSelector() {
	return createSelector(
		createSearchDataSelector(),
		createSearchItemSelector(),
		(searchData,searchItems:SearchItem[]):ISearchItemModel[] => {
			// Filter out non `Repo` first
			const allModels = searchData.results.reduce((map,nextResultData:SearchResultData) => {
				nextResultData.result.items.forEach((item,index) => {
					map[item.id] = nextResultData.data.models[index]
				})
				return map
			},{})

			return searchItems.map(item => ({item,model:allModels[item.id]}))
		}
	)
}