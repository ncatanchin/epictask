import {UserStore} from 'shared/models/User'
import {LabelStore} from 'shared/models/Label'
import {MilestoneStore} from 'shared/models/Milestone'
import {AvailableRepoStore} from 'shared/models/AvailableRepo'
import {RepoStore} from 'shared/models/Repo'
import {IssueStore} from 'shared/models/Issue'
import {CommentStore} from 'shared/models/Comment'
import {
	IModel,
	Repo as TSRepo
} from 'typestore'
import { IssuesEventStore, RepoEventStore } from "shared/models/GitHubEvents"


/**
 * All repo stores container
 */
export class Stores {

	issue:IssueStore
	issuesEvent:IssuesEventStore
	repo: RepoStore
	repoEvent:RepoEventStore
	availableRepo: AvailableRepoStore
	milestone: MilestoneStore
	comment: CommentStore
	label: LabelStore
	user: UserStore
	
	getModelStore<T extends IModel>(clazz:{new ():T}):TSRepo<T> {
		const name = clazz.name && clazz.name.length ?
			clazz.name :
			clazz.$$clazz
		
		return this[name] || this[_.lowerFirst(name)]
		
	}
	
}

/**
 * Get stores from container
 *
 * @returns {Stores}
 */
export function getStores():Stores {
	return Container.get(Stores)
}