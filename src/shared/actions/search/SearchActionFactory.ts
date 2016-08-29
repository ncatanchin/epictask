import {ActionFactory, ActionReducer} from 'typedux'
import {SearchKey} from 'shared/Constants'
import {AutoWired, Inject,Container} from 'typescript-ioc'
import {
	SearchMessage,
	SearchState,
	SearchResult,
	SearchType,
	SearchSource,
	ISearchItemModel,
	Search
} from './SearchState'
import {Repo, Issue, AvailableRepo} from 'shared/models'
import {RepoActionFactory} from '../repo/RepoActionFactory'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {IssueState} from 'shared/actions/issue/IssueState'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {Provided} from 'shared/util/Decorations'
import * as uuid from 'node-uuid'

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
@Provided
export class SearchActionFactory extends ActionFactory<SearchState,SearchMessage> {

	private repoActions:RepoActionFactory = Container.get(RepoActionFactory)
	private issueActions:IssueActionFactory = Container.get(IssueActionFactory)

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

	private updateSearch(state:SearchState,searchId:string,updater:(search:Search) => any) {
		return state.updateIn(['searches',searchId], new Search(), (search:Search) => {
			return updater(search)
		})
	}


	/**
	 * Set the search token
	 *
	 * @param searchId
	 * @param types
	 * @param query
	 */
	@ActionReducer()
	setQuery(searchId:string, types:SearchType[], query:string) {
		return (state:SearchState) => this.updateSearch(state,searchId,(search) => {
			return search.merge({query,types,id:searchId})
		})
	}

	@ActionReducer()
	setResults(searchId:string,source:SearchSource,newResults:SearchResult) {
		return (state:SearchState) => this.updateSearch(state,searchId,(search) => {
			return search.set('results',search.results.set(source,newResults))
		})

	}



	/**
	 * Select a search result
	 *
	 * @param searchId
	 * @param itemModel
	 * @returns {(dispatch:any, getState:any)=>Promise<any>}
	 */
	select(searchId:string,itemModel:ISearchItemModel) {
		log.debug('selected item',itemModel)

		const
			repoActions = this.repoActions,
			{model,item} = itemModel,
			issueActions = Container.get(IssueActionFactory),
			issueState:IssueState = issueActions.state,
			{issueFilter,issueSort} = issueState

		const newIssueFilter = _.cloneDeep(issueFilter)

		switch (model.$$clazz) {
			case AvailableRepo.$$clazz:
				assert(model.$$clazz === AvailableRepo.$$clazz)
				repoActions.setRepoEnabled(model,!model.enabled)
				break;

			case Repo.$$clazz:
				assert(model.$$clazz === Repo.$$clazz)
				repoActions.createAvailableRepo(model)
				break

			case Issue.$$clazz:
				this.issueActions.setSelectedIssueIds([model.id])
				break

			case Label.$$clazz:
				const issue:Issue = model
				const labelUrls = newIssueFilter.labelUrls || (newIssueFilter.labelUrls = [])
				const labelIndex = labelUrls.indexOf(issue.url)
				if (labelIndex === -1)
					labelUrls.push(issue.url)
				else
					labelUrls.splice(labelIndex,1)

				issueActions.setFilteringAndSorting(newIssueFilter)
				break

			case Milestone.$$clazz:
				const milestone:Milestone = model
				const milestoneIds = newIssueFilter.milestoneIds || (newIssueFilter.milestoneIds = [])
				const milestoneIndex = milestoneIds.indexOf(milestone.id)
				if (milestoneIndex === -1)
					milestoneIds.push(milestone.id)
				else
					milestoneIds.splice(milestoneIndex,1)

				issueActions.setFilteringAndSorting(newIssueFilter)
				break
		}


	}



}

export default SearchActionFactory