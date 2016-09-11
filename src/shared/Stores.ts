import {ActivityStore} from 'shared/models/Activity'
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



export class Stores {

	issue:IssueStore
	repo: RepoStore
	availableRepo: AvailableRepoStore
	milestone: MilestoneStore
	comment: CommentStore
	label: LabelStore
	activity: ActivityStore
	user: UserStore
	
	getModelStore<T extends IModel>(clazz:{new ():T}):TSRepo<T> {
		const name = clazz.name && clazz.name.length ?
			clazz.name :
			clazz.$$clazz
		
		return this[name] || this[_.lowerFirst(name)]
		
	}
	
}