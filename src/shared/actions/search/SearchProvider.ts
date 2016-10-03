import {List} from 'immutable'
import {FinderRequest, FinderResultArray} from 'typestore'
import {
	SearchType, SearchSource, SearchTypeSourceMap,
	SearchResult, SearchItem
} from 'shared/actions/search/SearchState'
import ValueCache from 'shared/util/ValueCache'

import { GitHubClient, createClient } from 'shared/GitHubClient'
import {RepoStore} from 'shared/models/Repo'

import {Benchmark} from 'shared/util/Benchmark'
import {getStoreState} from 'shared/store/AppStore'

import {
	enabledLabelsSelector,
	enabledMilestonesSelector, enabledAssigneesSelector
} from "shared/actions/repo/RepoSelectors"

import {IssueState} from "shared/actions/issue/IssueState"
import { AvailableRepo, Repo, Issue, Label, Milestone, User } from "shared/models"
import { getIssueActions, getRepoActions } from  "shared/actions/ActionFactoryProvider"
import { getStores } from "shared/Stores"
import { cloneObject } from "shared/util/ObjectUtil"
import { IIssueFilter } from "shared/actions/issue/IIssueFilter"



const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)


/**
 * Text filter a series of objects, by specific props
 *
 * @param query
 * @param items
 * @param props
 * @param limit
 * @returns {any[]}
 */
function textSearchFilter(query:string,items:List<any>,props:string[], limit:number = 4) {

	query = _.toLower(query)

	let matchCount = 0
	
	return List(items.filter(item => {
		if (limit !== -1 && matchCount > limit)
			return false

		const
			text = _.toLower(props.map(prop => _.get(item,prop,'')).join(' ')),
			match = text.indexOf(query) > -1
		
		if (match)
			matchCount++

		return match
	}))
}

export enum SearchEvent {
	Started = 1,
	Finished,
	ResultsUpdated
}

export type TSearchListener = (...args:any[]) => void

export default class SearchProvider {
	

	
	private pendingSearch:Promise<void>
	
	private searchTypes:SearchType[] = []
	
	
	/**
	 * Query string cache change listener
	 */
	
	queryCache:ValueCache
	
	/**
	 * Current result lists
	 */
	results:SearchResult[] = []
	
	/**
	 * Keeps track of the selected index
	 */
	selectedIndex:number
	
	/**
	 * Listener map
	 */
	listenerMap:{[eventType:string]:TSearchListener[]} = {}
	
	

	constructor()
	constructor(searchId:string)
	constructor(public searchId?:string) {
		if (!searchId)
			throw new Error(`Search id can not be null`)
		
		this.queryCache = new ValueCache((newValue,oldValue) => {
			if (!this.pendingSearch)
				this.pendingSearch = this.runSearch(newValue)
			
		})
		
	}
	
	/**
	 * Get listener list for event type
	 * @param event
	 * @returns {TSearchListener[]}
	 */
	private getListeners(event:SearchEvent) {
		return this.listenerMap[SearchEvent[event]] ||
			(this.listenerMap[SearchEvent[event]] = [])
	}
	
	/**
	 * Add a search listener
	 *
	 * @param event
	 * @param listener
	 * @returns {Function}
	 */
	addListener(event:SearchEvent,listener:TSearchListener):Function {
		let listeners = this.getListeners(event)
		
		listeners.push(listener)
		
		return () => {
			const index = listeners.indexOf(listener)
			if (index > -1) {
				listeners.splice(index,1)
			}
		}
	}
	
	/**
	 * Fire an event to all listeners
	 *
	 * @param event
	 * @param args
	 */
	private fireEvent(event:SearchEvent,...args:any[]) {
		this
			.getListeners(event)
			.forEach(listener => {
				try {
					listener(...args)
				} catch (err) {
					log.error(`Failed to notify search listener ${event}`,err)
				}
			})
	}
	
	/**
	 * Update the results and notify
	 *
	 * @param results
	 */
	private setResults(results:SearchResult[]) {
		this.results = results
		this.fireEvent(SearchEvent.ResultsUpdated,results)
	}
	
	
	private setStarted() {
		this.fireEvent(SearchEvent.Started)
	}
	
	private setFinished() {
		this.fireEvent(SearchEvent.Finished)
	}
	
	setTypes(...searchTypes:SearchType[]) {
		this.searchTypes = searchTypes
	}
	
	
	/**
	 * Update the query
	 */
	setQuery = _.debounce((query:string) => {
		this.queryCache.set(query)
	},250)
	
	
	mapResultsToSearchItems(idProperty:string,results:FinderResultArray<any>) {
		const md = results.itemMetadata
		return List<SearchItem>(results.map((item,index) => {
			const score = (md && md.length > index && md[index]) ?
				md[index].score : null

			return new SearchItem(item[idProperty],SearchType.Repo,item,score || 1)
		}))
	}
	
	/**
	 * Search repos
	 *
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchRepos(query:string):Promise<SearchResult> {
		const repoStore:RepoStore = getStores().repo

		const results = await repoStore.findWithText(new FinderRequest(4),query)
		log.info(`Found repos`,results)
		
		return new SearchResult(
			this.searchId,
			this.mapResultsToSearchItems('id',results),
			SearchType.Repo,
			SearchSource.Repo,
			results.length,
			results.total
		)


	}
	
	
	/**
	 * Search github
	 *
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchGitHub(query:string):Promise<SearchResult> {
		
		
		let
			items = List<SearchItem>()
		
		if (query && query.length > 3) {
			try {
				const
					repoStore:RepoStore = getStores().repo,
					client:GitHubClient = createClient(),
					results = await client.searchRepos(`fork:false ${query}`)
				
				for (let repo of results.items) {
					if (!repo.id)
						continue
					
					const
						existingRepo = await repoStore.get(repo.id)
					
					if (existingRepo) {
						repo = cloneObject(existingRepo,repo)
					}
					
					
					await repoStore.save(repo)
					
					
					items = items.push(
						new SearchItem(repo.id,SearchType.Repo,repo,(repo as any).score || 1)
					) as any
				}

				
			} catch (err) {
				log.info('Repo with explicitly name not found',err)
			}
		}
		
	
		return new SearchResult(
			this.searchId,
			items,
			SearchType.Repo,
			SearchSource.GitHub,
			items.size,
			items.size
		)
	}
	
	
	/**
	 * Search issues
	 *
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchIssues(query:string):Promise<SearchResult> {
		
		const
			issueState = getIssueActions().state,
			issues = issueState.issues
				.filter(issue =>
					[issue.title,issue.body,issue.user.login,issue.user.name]
							.join(' ').toLowerCase().indexOf(query.toLowerCase()) > -1
				)
				


		return new SearchResult(
			this.searchId,
			issues.map(issue => new SearchItem(issue.id,SearchType.Issue,issue,1)) as List<SearchItem>,
			SearchType.Issue,
			SearchSource.Issue,
			issues.size,
			issues.size
		)

	}
	@Benchmarker
	async searchAssignees(query:string):Promise<SearchResult> {
		const
			assignees = enabledAssigneesSelector(getStoreState()),
			items = textSearchFilter(
				query,
				assignees,
				['name','login']
			)
		
		
		return new SearchResult(
			this.searchId,
			items.map(item => new SearchItem(item.id,SearchType.Assignee,item,1)) as List<SearchItem>,
			SearchType.Assignee,
			SearchSource.Assignee,
			items.size,
			items.size
		)
	}
	
	
	
	@Benchmarker
	async searchMilestones(query:string):Promise<SearchResult> {
		const
			milestones = enabledMilestonesSelector(getStoreState()),
			items = textSearchFilter(
				query,
				milestones,
				['title','description','creator.name','creator.login']
			)


		return new SearchResult(
			this.searchId,
			items.map(item => new SearchItem(item.id,SearchType.Milestone,item,1)) as List<SearchItem>,
			SearchType.Milestone,
			SearchSource.Milestone,
			items.size,
			items.size
		)
	}
	
	@Benchmarker
	async searchLabels(query:string):Promise<SearchResult> {
		const
			labels = enabledLabelsSelector(getStoreState()),
			items = textSearchFilter(
				query,
				labels,
				['name']
			)


		return new SearchResult(
			this.searchId,
			items.map(item => new SearchItem(item.url,SearchType.Label,item,1)) as List<SearchItem>,
			SearchType.Label,
			SearchSource.Label,
			items.size,
			items.size
		)
	}

	@Benchmarker
	async searchAvailableRepos(query:string):Promise<SearchResult> {
		
		//TODO: Implement search for available repos

		return new SearchResult(
			this.searchId,
			List<SearchItem>(),
			SearchType.AvailableRepo,
			SearchSource.AvailableRepo,
			0,
			0
		)
	}



	/**
	 * All Search functions mapped
	 * by source type
	 *
	 */
	private searchFns:{[key:number]:(query:string) => SearchResult} = {
		[SearchSource.GitHub]: this.searchGitHub,
		[SearchSource.Repo]: this.searchRepos,
		[SearchSource.Issue]: this.searchIssues,
		[SearchSource.AvailableRepo]: this.searchAvailableRepos,
		[SearchSource.Label]: this.searchLabels,
		[SearchSource.Assignee]: this.searchAssignees,
		[SearchSource.Milestone]: this.searchMilestones
	} as any

	/**
	 * Execute a specific search type
	 *
	 * @param query
	 * @param source
	 * @returns {Promise<SearchResult>}
	 */
	async searchType(query:string,source:SearchSource):Promise<SearchResult> {
		return await this.searchFns[source].call(this,query)
	}
	
	/**
	 * Execute the search
	 *
	 * @param query
	 */
	private async runSearch(query:string) {
		log.info(`Running search with query: ${query}`)
		
		const nextSearch = () => {
			this.pendingSearch = (query !== this.queryCache.get()) ?
				this.runSearch(this.queryCache.get()) :
				null
		}
		
		if (!query || !query.length) {
			return nextSearch()
		}
		
		this.setStarted()
		
		try {
			const
				{searchId} = this,
				sources = this.searchTypes
					.reduce((sources,nextType) => sources
						.concat(SearchTypeSourceMap[nextType]),[]),
				searchPromises = sources.map(source => this.searchType(query, source))
			
			
			log.info(`Waiting for all type searches to return: ${searchId}`)
			const
				results = await Promise.all(searchPromises)
			
			log.info(`Got Results for ${query}`,results)
			this.setResults(results)
			
		} catch (err) {
			log.error(`Search failed`,err)
		} finally {
			this.setFinished()
		}
		
		
		nextSearch()
		
			
		
		
		
				

	}
	
	/**
	 * Select a search result
	 *
	 * @param searchId
	 * @param item
	 * @returns {(dispatch:any, getState:any)=>Promise<any>}
	 */
	select(searchId:string,item:SearchItem) {
		
		const
			model = item.value
		
		log.info('selected item',model)
		
		const
			repoActions = getRepoActions(),
			issueActions = getIssueActions(),
			issueState:IssueState = issueActions.state,
			{
				issueFilter,
				issueSort
			} = issueState
		
		const newIssueFilter = _.cloneDeep(issueFilter) as IIssueFilter
		
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
				issueActions.setSelectedIssueIds([model.id])
				break
			
			case User.$$clazz:
				const
					user:User = model
				let
					assigneeIds = newIssueFilter.assigneeIds || (newIssueFilter.assigneeIds = [])
				
				if (assigneeIds.includes(user.id))
					break
				
				assigneeIds.push(user.id)
				issueActions.setFilteringAndSorting(newIssueFilter)
				break
			
			case Label.$$clazz:
				const
					issue:Issue = model,
					labelUrls = newIssueFilter.labelUrls || (newIssueFilter.labelUrls = []),
					labelIndex = labelUrls.indexOf(issue.url)
				
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



// if (module.hot) {
//
// 	const hotInstances =_.get(module,'hot.data.instances')
// 	if (hotInstances)
// 		Object
// 			.keys(hotInstances)
// 			.forEach(searchId => {
// 				const
// 					instance = hotInstances[searchId],
// 					newProvider = new SearchProvider(instance.handler.searchId)
//
// 				assign(newProvider,_.pick(instance.target,'listenerMap','queryCache','results'))
//
// 				// Update the proxy
// 				instance.setTargets(SearchProvider,newProvider)
//
// 				// Add it back to the new map
// 				instances[instance.searchId] = instance
// 			})
//
// 	module.hot.dispose((data:any) => {
// 		assign(data,{
// 			instances
// 		})
// 	})
// 	module.hot.accept(() => log.info('hot reload',__filename))
// }
