import {List} from 'immutable'
import {FinderRequest, FinderResultArray} from 'typestore'
import {
	SearchType, SearchSource, SearchTypeSourceMap,
	SearchResult, SearchItem
} from "epic-typedux"
import {ValueCache} from  "epic-common"

import { GitHubClient, createClient } from "epic-github"
import {RepoStore} from "epic-models"

import {Benchmark} from  "epic-common"
import {getStoreState} from '../store/AppStore'

import {
	enabledLabelsSelector,
	enabledMilestonesSelector, enabledAssigneesSelector
} from "epic-typedux"


import { AvailableRepo, Repo, Issue, Label, Milestone, User } from "epic-models"
import { getIssueActions, getRepoActions } from "../provider"
import { getStores } from "epic-database-client"
import { cloneObject, cloneObjectShallow } from  "epic-common"
import { IIssueFilter } from "../state/issue"
import { getCommandManager } from  "epic-command-manager"
import { ICommand } from  "epic-command-manager"



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


/**
 * Handle search selection
 */
export type TSearchSelectHandler = (searchId:string,item:SearchItem) => any

/**
 * Clone the current issue filter
 *
 * @returns {IIssueFilter} - deep copied
 */
function newIssueFilter() {
	return cloneObject(getIssueActions().state.issueFilter)
}

/**
 * All current handlers
 */
const SelectHandlers:{[searchType:number]:TSearchSelectHandler} = {
	[SearchType.AvailableRepo]: (searchId:string,item:SearchItem) => {
		const
			model = item.value
		
		assert(model.$$clazz === AvailableRepo.$$clazz)
		getRepoActions().setRepoEnabled(model,!model.enabled)
	},
	[SearchType.Repo]: (searchId:string,item:SearchItem) => {
		const
			model = item.value
		
		assert(model.$$clazz === Repo.$$clazz)
		getRepoActions().createAvailableRepo(model)
	},
	[SearchType.Issue]: (searchId:string,item:SearchItem) => {
		const
			model = item.value
		
		assert(model.$$clazz === Issue.$$clazz)
		getIssueActions().setSelectedIssueIds([model.id])
	},
	[SearchType.Assignee]: (searchId:string,item:SearchItem) => {
		const
			user:User = item.value,
			newFilter = newIssueFilter()
		
		let
			assigneeIds = newFilter.assigneeIds || (newFilter.assigneeIds = [])
		
		if (assigneeIds.includes(user.id))
			return
		
		assigneeIds.push(user.id)
		getIssueActions().setFilteringAndSorting(newFilter)
	},
	[SearchType.Label]: (searchId:string,item:SearchItem) => {
		const
			newFilter = newIssueFilter(),
			label:Label = item.value,
			labelUrls = newFilter.labelUrls || (newFilter.labelUrls = []),
			labelIndex = labelUrls.indexOf(label.url)
		
		if (labelIndex === -1)
			labelUrls.push(label.url)
		else
			labelUrls.splice(labelIndex,1)
		
		getIssueActions().setFilteringAndSorting(newFilter)
	},
	[SearchType.Milestone]: (searchId:string,item:SearchItem) => {
		const
			newFilter = newIssueFilter(),
			milestone:Milestone = item.value,
			milestoneIds = newFilter.milestoneIds || (newFilter.milestoneIds = []),
			milestoneIndex = milestoneIds.indexOf(milestone.id)
		
		if (milestoneIndex === -1)
			milestoneIds.push(milestone.id)
		else
			milestoneIds.splice(milestoneIndex,1)
		
		getIssueActions().setFilteringAndSorting(newFilter)
	},
	[SearchType.Action]: (searchId:string,item:SearchItem) => {
		const
			cmd = item.value as ICommand
		
		log.debug(`Selected action (${cmd.id}), executing`)
		cmd.execute(cmd)
	}

}

/**
 * Get a search select handler
 *
 * @param type
 * @returns {TSearchSelectHandler}
 */
export function getSearchSelectHandler(type:SearchType):TSearchSelectHandler {
	return SelectHandlers[type]
}

/**
 * Search provider
 *
 * TODO: Redesign this
 */
export class SearchProvider {
	

	
	private pendingSearch:Promise<void>
	
	private searchTypes:SearchType[] = []
	
	/**
	 * Will an empty query return results (for things like actions)
	 *
	 * @type {boolean}
	 */
	allowEmptyQuery = false
	
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
	
	/**
	 * Per source limit
	 *
	 * @type {number}
	 */
	perSourceLimit:number = -1

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
	
	/**
	 * Search available repos
	 *
	 * @param query
	 * @returns {SearchResult}
	 */
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
	 * Find all matched actions
	 * @param query
	 * @returns {SearchResult}
	 */
	@Benchmarker
	async searchActions(query:string):Promise<SearchResult> {
		const
			allCommands = getCommandManager().allCommands()
		
		let
			results = List<ICommand>()
		
		if (query && query.length) {
			query = _.toLower(query || '')
			
			results = results.withMutations(tmpResults => {
				
				function findCommands(fuzzy:boolean) {
					for (let cmd of allCommands) {
						const
							name = _.toLower(cmd.name),
							index = name.indexOf(query)
						
						
						if ((fuzzy && index > -1) || (!fuzzy && index === 0)) {
							tmpResults.push(cmd)
						}
					}
				}
				
				// FIND EXACT
				findCommands(false)
				
				// IF NO EXACT MATCHES, GO FUZZY
				if (!tmpResults.size)
					findCommands(true)
				
				return tmpResults
			})
		} else {
			results = results.push(...allCommands)
		}
		
		return new SearchResult(
			this.searchId,
			
			results
				.map(cmd =>
					new SearchItem(cmd.id,SearchType.Action,cmd,1)
				) as List<SearchItem>,
			
			SearchType.Action,
			SearchSource.Action,
			results.size,
			results.size
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
		[SearchSource.Milestone]: this.searchMilestones,
		[SearchSource.Action]: this.searchActions
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
		
		if (!this.allowEmptyQuery && (!query || !query.length)) {
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
			
			
			log.debug(`Waiting for all type searches to return: ${searchId}`)
			const
				results = await Promise.all(searchPromises)
			
			log.debug(`Got Results for ${query}`,results)
			log.info(`Results`)
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
			handler = getSearchSelectHandler(item.type)
		
		handler(searchId,item)
		
	}
	

}

export default SearchProvider


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
