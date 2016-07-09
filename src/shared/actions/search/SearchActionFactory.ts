import {ActionFactory,Action} from 'typedux'
import {SearchKey} from "shared/Constants"
import {AutoWired,Inject, Container} from 'typescript-ioc'

import {SearchMessage, SearchState, SearchResult, SearchType, SearchSource} from './SearchState'
import {Repo, Issue, RepoStore, AvailableRepoStore, AvailableRepo} from 'shared/models'
import {cloneObject} from 'shared/util/ObjectUtil'
import {Stores} from 'main/services/DBService'
import {RepoActionFactory} from '../repo/RepoActionFactory'
import {createClient} from 'GitHubClient'
import {List} from 'immutable'

const uuid = require('node-uuid')

const log = getLogger(__filename)

// async function findRepos<M extends AvailableRepo|Repo,R extends AvailableRepoStore|RepoStore>(query:string, repoClazz:{new():R}):Promise<any[]> {
// 	const stores = Container.get(Stores)
// 	const tsRepo = stores.getStore(repoClazz) as AvailableRepoStore|RepoStore
//
// 	return await tsRepo.findByName(query)
//
// }

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
	setSearching(searchId:string,searching:boolean) {
	}

	/**
	 * Set the search token
	 *
	 * @param query
	 */
	@Action()
	setQuery(searchId:string, types:SearchType[], query:string) {
	}

	@Action()
	setResults(searchId:string,source:SearchSource,newResults:SearchResult) {
	}

	/**
	 * Update the search results
	 *
	 * @param type
	 * @param newItems
	 * @returns {function(any, any): undefined}
	 */
	@Action()
	updateResults(searchId:string, type: SearchType, newItems:List<SearchResult>) {
		return (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			// Index the results
			// const indexedItems = newItems.map((item,index) => {
			// 	item.index = index
			// 	return item
			// })

			//actions.setResults(searchId,_.uniqueListBy(List(indexedItems),'value','id'))

		}
	}



	@Action()
	select(searchId:string,result:SearchResult) {
		log.info('selected result',result)
		return async (dispatch,getState) => {
			const repoActions = this.repoActions.withDispatcher(dispatch,getState)

			// switch (result.type) {
			// 	case SearchType.AvailableRepo:
			// 		repoActions.setRepoEnabled(result.value,!result.value.enabled)
			// 		break;
			//
			// 	case SearchType.Repo:
			// 		repoActions.createAvailableRepo(result.value)
			// }
		}

	}

	@Action()
	search(searchId:string) {
		return async (dispatch,getState) => {
			// const actions = this.withDispatcher(dispatch,getState)
			// const repoActions = this.repoActions.withDispatcher(dispatch,getState)
			// actions.setSearching(searchId,true)
			//
			// const promises:Array<Promise<any>> = []
			//
			// const search = actions.state.searches.get(searchId)
			// const {query} = search
			//
			// if (query && query.length) {
			// 	promises.push(findRepos(query, RepoStore)
			// 		.then((repoItems:Repo[]) => {
			// 			const availRepos = repoActions.state.availableRepos
			//
			// 			repoItems = repoItems.filter(item => availRepos.findIndex(availRepo => availRepo.repoId === item.id) === -1)
			// 			const results = repoItems.map(result => new SearchResult(cloneObject(result)))
			//
			// 			//actions.updateResults(searchId,SearchType.Repo,results)
			//
			// 			return results
			// 		})
			// 		.then(async (repoResults) => {
			// 			const queryParts = query.split('/')
			// 			if (queryParts.length < 2 && queryParts.every(part => part.length > 0)) {
			// 				return
			// 			}
			//
			// 			try {
			// 				const client = createClient()
			// 				const repo = await client.repo(query)
			// 				log.info('GH repo result', repo)
			// 				if (repo) {
			// 					const repoState = repoActions.state
			// 					if (!repoState.repos.find(existingRepo => existingRepo.id === repo.id))
			// 						await repoActions.persistRepos([repo])
			//
			// 					repoResults.push(new SearchResult(repo))
			// 					//actions.updateResults(searchId,SearchType.Repo, repoResults)
			// 				}
			// 			} catch (err) {
			// 				log.info('Repo with explicity name not found',err)
			// 			}
			// 		}))
			//
			// 	promises.push(findRepos(query, AvailableRepoStore)
			// 		.then(async (availRepoItems:AvailableRepo[]) => {
			// 			let results = availRepoItems.map(result => new SearchResult(cloneObject(result)))
			//
			// 			//actions.updateResults(searchId,SearchType.AvailableRepo,results)
			// 		}))
			//
			// } else {
			// 	actions.setResults(searchId,List<SearchResult>())
			// }
			//
			// const onFinish = () => actions.setSearching(searchId,false)
			// Promise.all(promises).then(() => {
			// 	log.debug('search completed', query)
			// 	onFinish()
			// }).catch((err) => {
			// 	log.error('search failed',err)
			// 	onFinish()
			// 	throw err
			// })

		}
	}


	@Action()
	setError(err:Error) {

	}


}

export default SearchActionFactory