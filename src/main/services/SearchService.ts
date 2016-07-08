import {List,Map} from 'immutable'
import {Singleton, AutoWired,Inject, Container} from 'typescript-ioc'
import {ObservableStore} from 'typedux'
import {IService, ServiceStatus} from './IService'
import {SearchActionFactory} from 'shared/actions/search/SearchActionFactory'
import {Stores} from 'main/services/DBService'
import {Search} from 'shared/actions/search/SearchState'

const log = getLogger(__filename)


@AutoWired
@Singleton
export default class SearchService implements IService {

	private _status = ServiceStatus.Created

	private lastQuery = null
	private lastSearches = Map<string,Search>()
	private pendingSearch = null

	@Inject
	store:ObservableStore<any>

	@Inject
	searchActions:SearchActionFactory

	status():ServiceStatus {
		return this._status
	}

	async init():Promise<this> {
		this._status = ServiceStatus.Initialized
		return this
	}

	async start():Promise<this> {
		this._status = ServiceStatus.Started

		this.updateQuery()

		this.store.observe([this.searchActions.leaf()],(newSearches) => {
			this.updateQuery()
		})

		return this
	}

	async stop():Promise<this> {
		this._status = ServiceStatus.Stopped
		return this
	}

	destroy():this {
		return null
	}

	async doSearch(searchId:string,query:string) {

		// NOTE - we dont actually pass query along
		log.info('Searching with query',query)
		const stores = Container.get(Stores)
		const results = await stores.repo.findByName(query)

		if (this.pendingSearch) {
			this.pendingSearch.then(() => this.searchActions.search(searchId))
		} else {
			this.pendingSearch = this.searchActions.search(searchId)
		}

		try {
			let result = await this.pendingSearch
			log.info('search result',this.pendingSearch)
		} catch (err) {
			log.error('Search failed', err.stack)
		} finally {
			this.pendingSearch = null
		}
	}

	updateQuery() {
		const searches = this.searchActions.state.searches
		const searchIds = searches.keys()
		// for (let search)
		for (let searchId of searchIds) {
			const lastSearch = this.lastSearches.get(searchId)
			const search = searches.get(searchId)
			const newQuery = search.query
			if (lastSearch && (lastSearch.query === newQuery || lastSearch === search)) {
				//Search has not changed
				continue
			}

			// First update the ref
			this.lastSearches = this.lastSearches.set(searchId,search)

			log.info('Updating search for ',searchId,'with query ', newQuery)
			this.doSearch(searchId,newQuery)
		}


	}

}

