/**
 * State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {Issue, isIssue, Repo} from '../../../shared/GitHubSchema'
import {getStore} from '../../store'
import {RepoKey} from '../../../shared/Constants'

export enum SearchResultType {
	Issue = 1,
	Repo,
	AvailableRepo
}

export class SearchResult<T extends Issue|Repo> {

	type:SearchResultType


	constructor(public value:T) {
		const repoState = getStore().getState().get(RepoKey)

		this.type = isIssue(value) ? SearchResultType.Issue :
			_.includes(repoState.repos,value) ? SearchResultType.Repo :
				SearchResultType.AvailableRepo
	}

}



export class SearchResults {

	repos:SearchResult<Repo>[] = []
	availableRepos:SearchResult<Repo>[] = []
	issues:SearchResult<Issue>[] = []
	all:SearchResult<Issue|Repo>[] = []

	constructor(all:SearchResult<Repo|Issue>[]) {


		all.forEach((item:SearchResult<Repo|Issue>) => {
			//const searchItem = new SearchResult(item)

			//noinspection JSMismatchedCollectionQueryUpdate
			const itemList:SearchResult<Repo|Issue>[] = ((item.type === SearchResultType.Issue) ?
				this.issues : (item.type === SearchResultType.Repo) ?
				this.repos :
				this.availableRepos)

			itemList.push(item)
			this.all.push(item)
		})
	}
}

@RecordModel()
class SearchStateModel {

	@RecordProperty()
	results:SearchResults

	@RecordProperty()
	error:Error

	@RecordProperty()
	query:string

	@RecordProperty()
	searching:boolean

	setSearching(newSearching:boolean) {
		this.searching = newSearching
		return this
	}

	setQuery(newQuery:string) {
		this.query = newQuery
		return this
	}

	setResults(newResults:SearchResults) {
		this.results = newResults
		return this
	}

	setError(err:Error) {
		this.error = err
		return this
	}

}

const SearchStateDefaults = {
	results:new SearchResults([]),
	searching:false
}

export const SearchState = makeRecord(SearchStateModel,SearchStateDefaults)
export type TSearchState = typeof SearchState