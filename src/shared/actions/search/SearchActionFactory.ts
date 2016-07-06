import {ActionFactory,Action} from 'typedux'
import {SearchKey} from "../../Constants"
import {AutoWired,Inject, Container} from 'typescript-ioc'

import {SearchMessage,SearchState, SearchResult, TSearchResult,SearchResultType} from './SearchState'
import {Repo, Issue, RepoStore, AvailableRepoStore, AvailableRepo} from 'shared/models'
import {cloneObject} from '../../util/ObjectUtil'
import {Stores} from '../../../main/services/DBService'
import {RepoActionFactory} from '../repo/RepoActionFactory'
import {createClient} from '../../GitHubClient'
import {List} from 'immutable'

const uuid = require('node-uuid')

const log = getLogger(__filename)

async function findRepos<M extends AvailableRepo|Repo,R extends AvailableRepoStore|RepoStore>(query:string, repoClazz:{new():R}):Promise<any[]> {
	const stores = Container.get(Stores)
	const tsRepo = stores.getStore(repoClazz) as AvailableRepoStore|RepoStore

	return await tsRepo.findByName(query)


}

/**
 * Search Action Factory
 */
@AutoWired
export class SearchActionFactory extends ActionFactory<any,SearchMessage> {

	@Inject
	private repoActions:RepoActionFactory

	constructor() {
		super(SearchState)
	}

	/**
	 * Seach leaf
	 *
	 * @returns {string}
	 */
	leaf():string {
		return SearchKey;
	}


	@Action()
	setSearching(searching:boolean) {
	}

	/**
	 * Set the search token
	 *
	 * @param query
	 */
	@Action()
	setQuery(query:string) {
	}

	@Action()
	setResults(newResults:List<SearchResult<any>>) {
	}

	/**
	 * Update the search results
	 *
	 * @param type
	 * @param newItems
	 * @returns {function(any, any): undefined}
	 */
	@Action()
	updateResults(type: SearchResultType, newItems:TSearchResult[]) {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			// Index the results
			const indexedItems = newItems.map((item,index) => {
				item.index = index
				return item
			})

			actions.setResults(_.uniqueListBy(List(indexedItems),'value','id'))

		}
	}



	@Action()
	select(result:SearchResult<any>) {
		log.info('selected result',result)
		return async (dispatch,getState) => {
			const repoActions = this.repoActions.withDispatcher(dispatch,getState)

			switch (result.type) {
				case SearchResultType.AvailableRepo:
					repoActions.setRepoEnabled(result.value,!result.value.enabled)
					break;

				case SearchResultType.Repo:
					repoActions.createAvailableRepo(result.value)
			}
		}

	}

	@Action()
	search() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const repoActions = this.repoActions.withDispatcher(dispatch,getState)
			actions.setSearching(true)

			const promises:Array<Promise<any>> = []

			const {query} = actions.state

			if (query && query.length) {
				promises.push(findRepos(query, RepoStore)
					.then((repoItems:Repo[]) => {
						const availRepos = repoActions.state.availableRepos

						repoItems = repoItems.filter(item => availRepos.findIndex(availRepo => availRepo.repoId === item.id) === -1)
						const results = repoItems.map(result => new SearchResult<Repo>(cloneObject(result)))

						actions.updateResults(SearchResultType.Repo,results)

						return results
					})
					.then(async (repoResults) => {
						if (query.split('/').length < 2) {
							return
						}

						try {
							const repo = await createClient().repo(query)
							log.info('GH repo result', repo)
							if (repo) {
								const repoState = repoActions.state
								if (!repoState.repos.find(existingRepo => existingRepo.id === repo.id))
									await repoActions.persistRepos([repo])

								repoResults.push(new SearchResult(repo))
								actions.updateResults(SearchResultType.Repo, repoResults)
							}
						} catch (err) {
							log.info('Repo with explicity name not found',err)
						}
					}))

				promises.push(findRepos(query, AvailableRepoStore)
					.then(async (availRepoItems:AvailableRepo[]) => {
						let results = availRepoItems.map(result => new SearchResult<AvailableRepo>(cloneObject(result)))

						actions.updateResults(SearchResultType.AvailableRepo,results)
					}))

			} else {
				actions.setResults(List<SearchResult<any>>())
			}

			const onFinish = () => actions.setSearching(false)
			Promise.all(promises).then(() => {
				log.debug('search completed', query)
				onFinish()
			}).catch((err) => {
				log.error('search failed',err)
				onFinish()
				throw err
			})

		}
	}


	@Action()
	setError(err:Error) {

	}


}

export default SearchActionFactory