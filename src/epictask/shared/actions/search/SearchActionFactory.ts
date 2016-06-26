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
	// const {mapper} = tsRepo
	//
	// const count = await tsRepo.count()
	// log.info('Current count =' + count)
	// const models = jsons.map((json:any) => {
	// 	return mapper.fromObject(json) as M
	// })

	//return jsons
}
export class SearchActionFactory extends ActionFactory<any,SearchMessage> {

	constructor() {
		super(SearchState)
	}

	leaf():string {
		return SearchKey;
	}

	@Action()
	setSearching(searching:boolean) {
	}

	@Action()
	setToken(token:string) {}

	@Action()
	setQuery(query:string) {
	}

	@Action()
	setResults(newResults:List<any>) {
	}

	@Action()
	updateResults(type: SearchResultType, newItems:SearchResult<Repo|Issue>[]) {
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
					const
						availRepoRepo = Repos.availableRepo,
						availRepo = new AvailableRepo({
							id: uuid.v4(),
							repoId: result.value.id,
							enabled: true
						})

					log.info('Saving new available repo as ',availRepo.id)
					await availRepoRepo.save(availRepo)

					repoActions.getAvailableRepos()
					repoActions.syncRepoDetails(availRepo)
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
				const items = await findRepos(query, RepoRepo)
				actions.setResults(List(items))

				//
				// promises.push(findRepos(query, RepoRepo)
				// 	.then(repoItems => {
				// 		actions.updateResults(SearchResultType.Repo,cloneObject(repoItems))
				// 		return repoItems
				// 	})
				// 	.then(async (repoItems) => {
				// 		if (query.split('/').length < 2) {
				// 			return
				// 		}
				//
				// 		const repo = await createClient().repo(query)
				// 		log.info('GH repo result',repo)
				// 		if (repo) {
				// 			const repoState = repoActions.state
				// 			if (!repoState.repos.find(existingRepo => existingRepo.id === repo.id))
				// 				await repoActions.persistRepos([repo])
				//
				// 			repoItems.push(new SearchResult(repo))
				// 			actions.updateResults(SearchResultType.Repo,repoItems)
				// 		}
				// 	}))
				//
				// promises.push(findRepos(query, AvailableRepoRepo)
				// 	.then(async (availRepoItems) => {
				// 		actions.updateResults(SearchResultType.AvailableRepo,availRepoItems)
				//
				// 		const repoState = repoActions.state
				//
				// 		availRepoItems = availRepoItems.map((availRepoItem:SearchResult<AvailableRepo>) => {
				// 			const availRepo = availRepoItem.value
				// 			if (!availRepo.repo)
				// 				availRepo.repo = repoState.repos.find(repo => repo.id === availRepo.repoId)
				//
				// 			return availRepoItem
				// 		})
				//
				// 		actions.updateResults(SearchResultType.AvailableRepo,availRepoItems)
				// 	}))

			} else {
				actions.setResults(List())
			}

			// const onFinish = () => actions.setSearching(false)
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
