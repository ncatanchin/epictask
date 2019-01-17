import {IssuesListCommentsForRepoResponseItem} from "@octokit/rest"


export interface IComment extends IssuesListCommentsForRepoResponseItem {
	issue_id: number
	issue_url: string
	repository_url:string
}

export const CommentIndexes = {
	v1: "&id,issue_id,issue_url,html_url,repository_url,body"
}
