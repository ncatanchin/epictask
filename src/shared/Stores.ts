import {ActivityStore} from 'shared/models/Activity'
import {UserStore} from 'shared/models/User'
import {LabelStore} from 'shared/models/Label'
import {MilestoneStore} from 'shared/models/Milestone'
import {AvailableRepoStore} from 'shared/models/AvailableRepo'
import {RepoStore} from 'shared/models/Repo'
import {IssueStore} from 'shared/models/Issue'
import {CommentStore} from 'shared/models/Comment'



export class Stores {

	issue:IssueStore
	repo: RepoStore
	availableRepo: AvailableRepoStore
	milestone: MilestoneStore
	comment: CommentStore
	label: LabelStore
	activity: ActivityStore
	user: UserStore
	
}