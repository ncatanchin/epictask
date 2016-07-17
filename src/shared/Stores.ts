// import {Repo as TSRepo, IModel} from 'typestore'

import {ActivityStore} from 'models/Activity'
import {UserStore} from 'models/User'
import {LabelStore} from 'models/Label'
import {MilestoneStore} from 'models/Milestone'
import {AvailableRepoStore} from 'models/AvailableRepo'
import {RepoStore} from 'models/Repo'
import {IssueStore} from 'models/Issue'
import {CommentStore} from 'models/Comment'



export class Stores {

	//dbService

	constructor() {}

	issue:IssueStore
	repo: RepoStore
	availableRepo: AvailableRepoStore
	milestone: MilestoneStore
	comment: CommentStore
	label: LabelStore
	activity: ActivityStore
	user: UserStore

	// getStore<T extends TSRepo<M>, M extends IModel>(repoClazz:{new ():T;}):T {
	// 	return this.dbService.getStore(repoClazz)
	// }
}