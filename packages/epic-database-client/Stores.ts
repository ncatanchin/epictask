import { IModel, Repo as TSRepo } from "typestore"

import {
	UserStore,
	LabelStore,
	MilestoneStore,
	RepoStore,
	IssueStore,
	CommentStore,
	IssuesEventStore,
	RepoEventStore,
	GithubNotificationStore
} from "epic-models"
import { AvailableRepoStore } from "epic-models/AvailableRepo"

declare global {
	interface IStores extends Stores {}
}

/**
 * All repo stores container
 */
export class Stores {

	notification:GithubNotificationStore
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