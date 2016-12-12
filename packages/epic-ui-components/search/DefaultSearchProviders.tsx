import { List } from "immutable"
import { FinderRequest, FinderResultArray } from "typestore"
import { RepoStore, AvailableRepo, Repo, Issue, Label, Milestone, User, SearchItem } from "epic-models"
import { getStores } from "epic-database-client"

import {
	enabledLabelsSelector,
	enabledMilestonesSelector,
	enabledAssigneesSelector
} from "epic-typedux/selectors/RepoSelectors"

import { GitHubClient, createClient } from "epic-github"
import { getCommandManager } from "epic-command-manager"
import { Benchmark, cloneObjectShallow, canEditRepo } from "epic-global"
import { getRepoActions } from "epic-typedux/provider/ActionFactoryProvider"
import { isNil } from "typeguard"



const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)

log.setOverrideLevel(LogLevel.DEBUG)

function mapResultsToSearchItems(
	provider:ISearchProvider,
	idProperty: string,
	results: FinderResultArray<any>,
	scoreMapper?: (val) => number
) {
	const md = results.itemMetadata
	return List<SearchItem>(results.map((item, index) => {
		const score = (md && md.length > index && md[ index ]) ?
			md[ index ].score : null
		
		return new SearchItem(
			item[ idProperty ],
			provider,
			item,
			scoreMapper ? scoreMapper(item) : (score || 1)
		)
	}))
}


/**
 * Text filter a series of objects, by specific props
 *
 * @param query
 * @param items
 * @param props
 * @param limit
 * @returns {any[]}
 */
function textSearchFilter(query:string, items:List<any>, props:string[], limit:number = 4) {
	
	query = _.toLower(query)
	
	let matchCount = 0
	
	return items.filter(item => {
		if (limit !== -1 && matchCount > limit)
			return false
		
		const
			text = _.toLower(props.map(prop => _.get(item, prop, '')).join(' ')),
			match = text.indexOf(query) > -1
		
		if (match)
			matchCount++
		
		return match
	})
}


/**
 * Handler to create AvailableRepo
 *
 * @param item
 */
function createAvailableRepoHandler(item:SearchItem) {
	const
		model = item.value
	
	assert(model.$$clazz === Repo.$$clazz)
	getRepoActions().createAvailableRepo(model)
}

/**
 * Search repos
 *
 * @param query
 * @returns {SearchResult}
 */
export class RepoSearchProvider implements ISearchProvider {
	
	id = Repo.$$clazz
	
	name = Repo.$$clazz
	
	@Benchmarker
	async query(criteria, query:string):Promise<List<SearchItem>> {
		const repoStore:RepoStore = getStores().repo
		
		const
			results = await repoStore.findWithText(new FinderRequest(4), query)
		
		log.debug(`Found repos`, results)
		
		return mapResultsToSearchItems(this, 'id', results, (repo) => {
			const
				canEdit = canEditRepo(repo),
				score = canEdit ? 0 : 1
			
			log.debug(`Scoring ${repo.full_name}: edit=${canEdit} score=${score}`)
			
			return score
		})
		
		
	}
	
	handleItem = createAvailableRepoHandler
}

/**
 * Search github
 *
 * @param query
 * @returns {SearchResult}
 */

export class GitHubSearchProvider implements ISearchProvider {
	id = 'Github'
	name = 'Github'
	
	handleItem = createAvailableRepoHandler
	
	@Benchmarker
	async query(criteria, text):Promise<List<SearchItem>> {
		
		
		let
			items = List<SearchItem>()
		
		if (_.size(text) > 3) {
			try {
				const
					repoStore:RepoStore = getStores().repo,
					client:GitHubClient = createClient(),
					results = await client.searchRepos(`fork:false ${text}`)
				
				for (let repo of results.items) {
					if (!repo.id)
						continue
					
					const
						existingRepo = await repoStore.get(repo.id)
					
					if (existingRepo) {
						repo = cloneObjectShallow(existingRepo, repo)
					}
					
					
					await repoStore.save(repo)
					
					
					items = items.push(
						new SearchItem(repo.id, this, repo, canEditRepo(repo) ? 0 : 1)
					) as any
				}
				
				
			} catch (err) {
				log.info('Repo with explicitly name not found', err)
			}
		}
		
		
		return items
	}
}

/**
 * Search issues
 *
 * @returns {SearchResult}
 * @param criteria
 * @param text
 */

export class IssueSearchProvider implements ISearchProvider {
	
	id = Issue.$$clazz
	name = Issue.$$clazz
	
	@Benchmarker
	async query(criteria, text:string):Promise<List<ISearchItem>> {
		
		// const
		// 	issueState = getIssueActions().state,
		// 	issues = issueState.issues
		// 		.filter(issue =>
		// 			[issue.title,issue.body,issue.user.login,issue.user.name]
		// 					.join(' ').toLowerCase().indexOf(query.toLowerCase()) > -1
		// 		)
		//
		//
		
		// return new SearchResult(
		// 	this.searchId,
		// 	issues.map(issue => new SearchItem(issue.id,SearchType.Issue,issue,1)) as List<SearchItem>,
		// 	SearchType.Issue,
		// 	SearchSource.Issue,
		// 	issues.size,
		// 	issues.size
		// )
		return null
		
	}
}
export class AssigneeSearchProvider implements ISearchProvider {
	
	id = 'Assignee'
	name = 'Assignee'
	
	@Benchmarker
	async query(query:string):Promise<List<SearchItem>> {
		const
			assignees = enabledAssigneesSelector(getStoreState()),
			items = textSearchFilter(
				query,
				assignees,
				[ 'name', 'login' ]
			)
		
		
		return items.map(item => new SearchItem(item.id, this, item, 1)) as List<SearchItem>
	}
}


export class MilestoneSearchProvider implements ISearchProvider {
	id = Milestone.$$clazz
	name = Milestone.$$clazz
	
	async query(criteria, query:string):Promise<List<SearchItem>> {
		const
			milestones = enabledMilestonesSelector(getStoreState()),
			items = textSearchFilter(
				query,
				milestones,
				[ 'title', 'description', 'creator.name', 'creator.login' ]
			)
		
		
		return items.map(item => new SearchItem(item.id, this, item, 1)) as List<SearchItem>
	}
}

export class LabelSearchProvider implements ISearchProvider {
	
	id = Label.$$clazz
	
	name = Label.$$clazz
	
	@Benchmarker
	async query(criteria, query:string):Promise<List<SearchItem>> {
		const
			labels = enabledLabelsSelector(getStoreState()),
			items = textSearchFilter(
				query,
				labels,
				[ 'name' ]
			)
		
		
		return items.map(item => new SearchItem(item.url, this, item, 1)) as List<SearchItem>
	}
}
/**
 * Search available repos
 *
 * @param query
 * @returns {SearchResult}
 */

export class AvailableRepoSearchProvider {
	id = AvailableRepo.$$clazz
	name = AvailableRepo.$$clazz
	@Benchmarker
	async query(criteria, query:string):Promise<List<SearchItem>> {
		
		//TODO: Implement search for available repos
		
		return List<SearchItem>()
	}
	
	handleItem(item:SearchItem) {
		
		const
			model = item.value
		
		assert(model.$$clazz === AvailableRepo.$$clazz)
		getRepoActions().setRepoEnabled(model, !model.enabled)
		
	}
}

/**
 * Find all matched actions
 * @param query
 * @returns {SearchResult}
 */

export class ActionSearchProvider {

	id = 'Action'
	name = 'Action'
	
	@Benchmarker
	async query(criteria, query:string):Promise<List<SearchItem>> {
		const
			allCommands = Object
				.values(Commands)
				.filter(it => it.type === CommandType.App && it.hidden !== true && !isNil(it.name)) as ICommand[]//getCommandManager().allCommands()
		
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
		
		return results
			.map(cmd =>
				new SearchItem(cmd.id, this, cmd, 1)
			) as List<SearchItem>
	}
	
	handleItem(item:ISearchItem) {
		const
			cmd = item.value as ICommand
		
		log.debug(`Selected action (${cmd.id}), executing`)
		cmd.execute(cmd)
	}
}
