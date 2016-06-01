
import {SearchActionFactory} from '../actions/search/SearchActionFactory'
import {getStore} from '../store/AppStore'

const store = getStore()
const searchActions = new SearchActionFactory()
const log = getLogger(__filename)

let lastQuery = null
let pendingSearch = null

async function doSearch(query:string) {

	// NOTE - we dont actually pass query along
	log.info('Searching with query',query)

	if (pendingSearch) {
		pendingSearch.then(() => searchActions.search())
	} else {
		pendingSearch = searchActions.search()
	}

	try {
		let result = await pendingSearch
		log.info('search result',pendingSearch)
	} catch (err) {
		log.error('Search failed', err.stack)
	} finally {
		pendingSearch = null
	}
}


const debounceSearch = _.debounce(doSearch,200)

function updateQuery() {
	const searchState = searchActions.state

	const newQuery = searchState.query
	if (newQuery === lastQuery) {
		return
	}

	lastQuery = newQuery
	debounceSearch(newQuery)

}

updateQuery()

store.observe([searchActions.leaf(),'query'],(newQuery) => {
	log.debug('Got new query',newQuery,lastQuery)
	updateQuery()
})
