
import * as Models from 'shared/models'

export interface IRepos {
	issue:Models.IssueRepo
	repo: Models.RepoRepo
	availableRepo: Models.AvailableRepoRepo
	milestone: Models.MilestoneRepo
	comment: Models.CommentRepo
	label: Models.LabelRepo
	activity: Models.ActivityRepo
	user: Models.UserRepo
}
