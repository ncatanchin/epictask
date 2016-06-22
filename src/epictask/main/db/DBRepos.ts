
import {ActivityRepo} from '../../shared/models/Activity'
import {UserRepo} from '../../shared/models/User'
import {LabelRepo} from '../../shared/models/Label'
import {MilestoneRepo} from '../../shared/models/Milestone'
import {AvailableRepoRepo} from '../../shared/models/AvailableRepo'
import {RepoRepo} from '../../shared/models/Repo'
import {IssueRepo} from '../../shared/models/Issue'
import {CommentRepo} from '../../shared/models/Comment'

export interface IRepos {
	issue:IssueRepo
	repo: RepoRepo
	availableRepo: AvailableRepoRepo
	milestone: MilestoneRepo
	comment: CommentRepo
	label: LabelRepo
	activity: ActivityRepo
	user: UserRepo
}
