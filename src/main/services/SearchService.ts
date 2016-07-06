import {List} from 'immutable'
import {Singleton, AutoWired,Inject, Container} from 'typescript-ioc'
import {ObservableStore} from 'typedux'
import {IService, ServiceStatus} from './IService'
import {SearchActionFactory} from 'shared/actions/search/SearchActionFactory'
import {Stores} from 'main/services/DBService'

const log = getLogger(__filename)


@AutoWired
@Singleton
export default class SearchService implements IService {

	private _status = ServiceStatus.Created

	private lastQuery = null
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

		this.store.observe([this.searchActions.leaf(),'query'],(newQuery) => {
			log.debug('Got new query',newQuery,this.lastQuery)
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

	async doSearch(query:string) {

		// NOTE - we dont actually pass query along
		log.info('Searching with query',query)
		const stores = Container.get(Stores)
		const results = await stores.repo.findByName(query)

		if (this.pendingSearch) {
			this.pendingSearch.then(() => this.searchActions.search())
		} else {
			this.pendingSearch = this.searchActions.search()
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
		const searchState = this.searchActions.state

		const newQuery = searchState.query
		if (newQuery === this.lastQuery) {
			return
		}

		this.lastQuery = newQuery
		this.doSearch(newQuery)
	}

}

