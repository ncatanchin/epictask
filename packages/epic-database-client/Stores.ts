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
import { isString } from "typeguard"
import { getDatabaseAdapter } from "epic-database-adapters/DatabaseAdapterProvider"
//import { getDatabaseClient } from "./DatabaseClient"

declare global {
	interface IStores {
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
	}
}

/**
 * All repo stores container
 */
export class Stores implements IStores {

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
	
	getModelStoreName<T extends IModel>(clazz:{new ():T}):string {
		return clazz.name && clazz.name.length ?
			clazz.name :
			clazz.$$clazz
	}
	
	getModelStore<T extends IModel>(clazz:{new ():T}):TSRepo<T> {
		const
			name = this.getModelStoreName(clazz)
		
		return this[name] || this[_.lowerFirst(name)]
		
	}
	
	/**
	 * Add a model store to the database coordinator
	 *
	 * @param nameOrClazz
	 * @param store
	 */
	addModelStore<T extends IModel,TC extends IModelConstructor<T>>(nameOrClazz:string|TC, store:TSRepo<T>):void {
		
		const
			name = isString(nameOrClazz) ? nameOrClazz : this.getModelStoreName(nameOrClazz)
		
		this[_.lowerFirst(name)] = getDatabaseAdapter()
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


if (DEBUG) {
	
}