import {FinderRequest, FinderResultArray} from 'typestore'
import {List,Map} from 'immutable'
import {Singleton, AutoWired,Inject, Container} from 'typescript-ioc'
import {ObservableStore} from 'typedux'
import {IService, ServiceStatus, BaseService} from './IService'
import {SearchActionFactory} from 'shared/actions/search/SearchActionFactory'
import {Stores} from 'main/services/DBService'
import {
	Search, SearchState, SearchType, SearchSource, SearchTypeSourceMap,
	SearchSourceTypeMap, SearchResult, SearchItem
} from 'shared/actions/search/SearchState'
import ValueCache from 'shared/util/ValueCache'
import {debounce} from 'lodash-decorators'
import {GitHubClient} from 'shared/GitHubClient'
import {RepoStore, Repo} from 'shared/models/Repo'
import {IssueStore, Issue} from 'shared/models/Issue'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {DataRequest} from 'shared/actions/data/DataState'
import {AvailableRepo} from 'shared/models/AvailableRepo'



const log = getLogger(__filename)


@AutoWired
@Singleton
export default class SearchService extends BaseService {

	private queriesCache:{[searchId:string]:ValueCache} = {}

	private lastQuery = null
	private lastSearches = Map<string,Search>()
	private runningSearches:Promise<any>[] = []
	private searches:Map<string,Search>
	private removeListener

	@Inject
	store:ObservableStore<any>

	@Inject
	stores:Stores

	@Inject
	searchActions:SearchActionFactory

	@Inject
	dataActions:DataActionFactory

	private getQueryCache(searchId) {
		let cache = this.queriesCache[searchId]
		if (!cache) {
			cache = this.queriesCache[searchId] = new ValueCache((newValue,oldValue) => {
				this.scheduleSearch(searchId)
			})
		}

		return cache
	}

	async start():Promise<this> {
		await super.start()

		this.removeListener = this.store.observe([this.searchActions.leaf(),'searches'],(newSearches:Map<string,Search>) => {
			this.searches = newSearches

			newSearches.keySeq()
				.toArray()
				.forEach(searchId => {
					const search:Search = newSearches.get(searchId)
					let valueCache = this.getQueryCache(searchId)
					valueCache.set(search.query)
				})


		})

		return this
	}


	stop():Promise<this> {
		this.unsubscribe()
		return super.stop()
	}

	/**
	 * Unsubscribe from the store
	 */
	private unsubscribe() {
		if (this.removeListener) {
			this.removeListener()
			this.removeListener = null
		}
	}

	mapResultsToSearchItems(results:FinderResultArray<number>) {
		const md = results.itemMetadata
		return results.map((id,index) => {
			const score = (md && md.length > index && md[index]) ?
				md[index].score : null

			return new SearchItem(id,SearchType.Repo,score || 1)
		})
	}

	async searchRepos(search:Search):Promise<SearchResult> {
		const repoStore:RepoStore = this.stores.repo

		const results:FinderResultArray<number> =
			await repoStore.findWithText(new FinderRequest(10),search.query)

		return new SearchResult(
			search.id,
			this.mapResultsToSearchItems(results),
			SearchType.Repo,
			SearchSource.Repo,
			results.length,
			results.total
		)
	}


	async searchGithubRepos(search:Search):Promise<SearchResult> {
		const {query} = search
		const queryParts = query.split('/')

		let result = -1
		if (queryParts.length === 2 && queryParts.every(part => part.length > 0)) {
			try {
				const repoStore:RepoStore = this.stores.repo

				result = await repoStore.findByFullName(query)
				log.info('GitHub repo local id search',result,'for query',query)
				if (!_.isNumber(result) || result < 1) {
					log.info('Going to query GitHub')
					const client:GitHubClient = Container.get(GitHubClient)
					let repo = await client.repo(query)

					log.info('GitHub exact repo result', repo)

					if (repo) {
						log.info('Saving GitHub match locally for the future')
						const existingRepo = await repoStore.get(repo.id)
						if (existingRepo)
							log.warn(`Names dont match, but we already have a record of this repo???  going to overwrite it`)

						repo = Object.assign({},existingRepo,repo)
						repo = await repoStore.save(repo)

						result = repo.id

					}
				}

			} catch (err) {
				log.info('Repo with explicity name not found',err)
			}
		}

		const count = result && result > 0 ? 1 : 0

		return new SearchResult(
			search.id,
			(count) ? [new SearchItem(result,SearchType.Repo,1)] : [],
			SearchType.Repo,
			SearchSource.ExactRepo,
			count,
			count
		)
	}

	async searchIssues(search:Search):Promise<SearchResult> {
		const issueStore:IssueStore = this.stores.issue

		const results:FinderResultArray<number> =
			await issueStore.findWithText(new FinderRequest(10),search.query)

		return new SearchResult(
			search.id,
			this.mapResultsToSearchItems(results),
			SearchType.Issue,
			SearchSource.Issue,
			results.length,
			results.total
		)

	}

	async searchAvailableRepos(search:Search):Promise<SearchResult> {

		//TODO: Implement search for available repos

		return new SearchResult(
			search.id,
			[],
			SearchType.AvailableRepo,
			SearchSource.AvailableRepo,
			0,
			0
		)
	}

	private requestData(search:Search,source:SearchSource) {
		return (result:SearchResult) => {

			this.dataActions.submitRequest(new DataRequest({
				id:result.dataId,
				modelIds: result.items.map(item => item.id),
				modelType: (([SearchSource.Repo,SearchSource.ExactRepo].includes(source)) ? Repo :
					(source === SearchSource.AvailableRepo) ? AvailableRepo : Issue).$$clazz
			}))

			return result
		}
	}
	async searchType(search:Search,source:SearchSource) {
		const searchPromise = ((source === SearchSource.Repo) ?
			this.searchRepos(search)  : (source === SearchSource.ExactRepo) ?
			this.searchGithubRepos(search)  : (source === SearchSource.Issue) ?
			this.searchIssues(search) :
			this.searchAvailableRepos(search))

		// Add the data request to the promise
		searchPromise.then(this.requestData(search,source))

		// Now wait for results
		const searchResult = await searchPromise

		this.searchActions.setResults(
			search.id,
			source,
			searchResult
		)

		await Promise.setImmediate()

		return searchResult
	}


	@debounce(100)
	scheduleSearch(searchId) {

		const runningSearch = this.runningSearches[searchId]
		if (runningSearch) {
			if (!runningSearch.isFulfilled())
				return runningSearch

			delete this.runningSearches[searchId]
		}

		// The actually search function
		const runSearch = async () => {
			const actions = Container.get(SearchActionFactory)
			const state:SearchState = actions.state
			const search = state.searches.get(searchId)
			assert(search, 'Search is not defined???')
			assert(search.types && search.types.size > 0, 'At least one search type is required')


			try {
				const sources = search.types
					.reduce((sources,nextType) => sources
						.concat(SearchTypeSourceMap[nextType]),[])

				const searchPromises = sources.map(source => this.searchType(search, source))

				log.info(`Waiting for all type searches to return: ${search}`)
				await Promise.all(searchPromises)
			} finally {
				const currentSearch = actions.state.searches.get(searchId)
				delete this.runningSearches[searchId]

				if (currentSearch.query !== search.query) {
					log.info('query changed while searching, schedule another search for the next tick')
					process.nextTick(() => this.scheduleSearch(searchId))
				}

			}
		}

		return this.runningSearches[searchId] = runSearch()



	}

}

