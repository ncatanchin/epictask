import {ActionFactory,Action} from 'typedux'
import {SearchKey} from "shared/Constants"

import {SearchMessage,SearchState, SearchResult, SearchResultType} from './SearchState'
import {Repo, Issue, RepoRepo, AvailableRepoRepo, AvailableRepo} from 'shared/models'
import {cloneObject} from 'shared/util/ObjectUtil'
import {getRepo,Repos} from 'main/db/DB'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {createClient} from 'shared/GitHubClient'
import {List} from 'immutable'
const uuid = require('node-uuid')
const log = getLogger(__filename)

async function findRepos<M extends AvailableRepo|Repo,R extends AvailableRepoRepo|RepoRepo>(query:string,repoClazz:{new():R}):Promise<any[]> {
	const tsRepo = getRepo(repoClazz) as AvailableRepoRepo|RepoRepo

	return await tsRepo.findByName(query)


}

/**
 * Search Action Factory
 */
export class SearchActionFactory extends ActionFactory<any,SearchMessage> {

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
	updateResults(type: SearchResultType, newItems:SearchResult<Repo|AvailableRepo|Issue>[]) {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)



			actions.setResults(List(newItems))
			// const results = actions.state.results
			// if (!results) {
			//
			// } else {
			// 	const allItems = results
			// 		.filter(item => item.type !== type)
			// 		.concat(List(newItems))
			//
			//
			// 	actions.setResults(allItems)
			// }
		}
	}



	@Action()
	select(result:SearchResult<any>) {
		log.info('selected result',result)
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			const repoActions = RepoActionFactory.newWithDispatcher(RepoActionFactory,dispatch,getState)

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
			const repoActions = RepoActionFactory.newWithDispatcher(RepoActionFactory,dispatch,getState)
			actions.setSearching(true)

			const promises:Array<Promise<any>> = []

			const {query} = actions.state

			if (query && query.length) {
				// const items = await findRepos(query, RepoRepo)
				// actions.setResults(List(items))


				promises.push(findRepos(query, RepoRepo)
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

						const repo = await createClient().repo(query)
						log.info('GH repo result',repo)
						if (repo) {
							const repoState = repoActions.state
							if (!repoState.repos.find(existingRepo => existingRepo.id === repo.id))
								await repoActions.persistRepos([repo])

							repoResults.push(new SearchResult(repo))
							actions.updateResults(SearchResultType.Repo,repoResults)
						}
					}))

				promises.push(findRepos(query, AvailableRepoRepo)
					.then(async (availRepoItems:AvailableRepo[]) => {
						let results = availRepoItems.map(result => new SearchResult<AvailableRepo>(cloneObject(result)))

						actions.updateResults(SearchResultType.AvailableRepo,results)

						//const repoState = repoActions.state

						// results = results.map((availRepoItem:SearchResult<AvailableRepo>) => {
						// 	const availRepo = availRepoItem.value
						// 	if (!availRepo.repo)
						// 		availRepo.repo = repoState.repos.find(repo => repo.id === availRepo.repoId)
						//
						// 	return availRepoItem
						// })

						//actions.updateResults(SearchResultType.AvailableRepo,results)
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
