import {ActionFactory,Action} from 'typedux'
import {createClient} from '../../../shared/GitHubClient'
import {SearchKey} from "../../../shared/Constants"
import {AppActionFactory,RepoActionFactory} from '../'
import {SearchState, SearchResults, SearchResult} from './SearchState'
import {SearchMessage} from './SearchReducer'
import {AppStateType,Settings} from 'epictask/shared'
import {Repo} from '../../../shared/GitHubSchema'

const log = getLogger(__filename)
const gAppActions = new AppActionFactory()

async function findRepos(query:string,repos:Repo[] = []):Promise<SearchResult<any>[]> {
	query = (query || '').toLowerCase()
	return repos.filter(repo => repo.name.toLowerCase().indexOf(query) > -1)
		.map(repo => new SearchResult<any>(repo))
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
	search() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)
			actions.setSearching(true)

			const repoActions = RepoActionFactory
				.newWithDispatcher(RepoActionFactory,dispatch,getState)


			const repoState = repoActions.state


			const {query} = actions.state
			const allMatches = []

			allMatches.push(...await findRepos(query,repoState.repos))
			allMatches.push(...await findRepos(query,repoState.availableRepos))

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
