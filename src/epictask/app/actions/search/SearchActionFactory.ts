import {ActionFactory,Action} from 'typedux'
import {SearchKey} from "../../../shared/Constants"

import {SearchState, SearchResults, SearchResult, SearchResultType} from './SearchState'
import {SearchMessage} from './SearchReducer'
import {Repo, Issue, RepoRepo, AvailableRepoRepo, AvailableRepo} from 'shared/models'
import {getRepo} from 'shared/DB'
import {AppActionFactory} from '../AppActionFactory'
import {RepoActionFactory} from '../repo/RepoActionFactory'

const uuid = require('node-uuid')
const log = getLogger(__filename)
const gAppActions = new AppActionFactory()


async function findRepos<M extends AvailableRepo|Repo,R extends AvailableRepoRepo|RepoRepo>(query:string,repoClazz:{new():R}):Promise<SearchResult<any>[]> {
	const tsRepo = getRepo(repoClazz) as AvailableRepoRepo|RepoRepo

	const jsons:Array<AvailableRepo|Repo> = await tsRepo.findByName(query)
	const {mapper} = tsRepo

	const count = await tsRepo.count()
	log.info('Current count =' + count)
	const models = jsons.map((json:any) => {
		return mapper.fromObject(json) as M
	})

	return models.map(repo => new SearchResult<any>(repo))
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
	setResults(results:SearchResults) {
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
					const availRepo = new AvailableRepo({
						id: uuid.v4(),
						repoId: result.value.id
					})

					const availRepoRepo = getRepo(AvailableRepoRepo)

					log.info('Saving new available repo as ',availRepo.id,availRepo)
					await availRepoRepo.save(availRepo)

					return repoActions.getAvailableRepos()
			}
		}

	}

	@Action()
	search() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			actions.setSearching(true)

			const {query} = actions.state
			const allMatches:SearchResult<Repo|Issue>[] = []

			if (query && query.length) {
				let allRepos = await findRepos(query, RepoRepo)
				const availableRepos = await findRepos(query, AvailableRepoRepo)

				const repoRepo = getRepo(RepoRepo)
				availableRepos.forEach(async (availRepo:SearchResult<AvailableRepo>) => {
					if (!availRepo.value.repo)
						availRepo.value.repo = await repoRepo.get(repoRepo.key(availRepo.value.repoId))

				})
				const availableRepoIds = availableRepos.map(availableRepo => availableRepo.value.repoId)
				allRepos = allRepos.filter(repo => !availableRepoIds.includes(repo.value.id))



				allMatches.push(...availableRepos)
				allMatches.push(...allRepos)
			}

			const results = new SearchResults(allMatches)
			actions.setResults(results)

			log.info('Search completed',results)
			return results

		}
	}


	@Action()
	setError(err:Error) {

	}


}
