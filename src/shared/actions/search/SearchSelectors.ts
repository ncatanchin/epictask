

import { createSelector } from 'reselect'
import {SearchKey} from 'shared/Constants'
import {Map} from 'immutable'
import {Search} from 'shared/actions/search/SearchState'


const searchesSelector = state => state.get(SearchKey).searches


const queriesSelector = createSelector(searchesSelector,(searches:Map<string,Search>) => {
	const searchIds = searches.keySeq().toArray()
	searchIds.reduce((queries,searchId) => {
		queries[searchId] = searches.get(searchId).query
		return queries
	},{})

	return searchIds
})