import { IModel, Repo as TSRepo } from "typestore"

import {
	UserStore,
	LabelStore,
	MilestoneStore,
	AvailableRepoStore,
	RepoStore,
	IssueStore,
	CommentStore,
	IssuesEventStore,
	RepoEventStore
} from "epic-models"



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