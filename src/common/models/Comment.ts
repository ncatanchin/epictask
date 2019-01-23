import {IssuesListCommentsForRepoResponseItem} from "@octokit/rest"
import {getValue, isDefined} from "typeguard"


export interface IComment extends IssuesListCommentsForRepoResponseItem {
	issue_id: number
	issue_url: string
	repository_url:string
}

export const CommentIndexes = {
	v1: "&id,issue_id,issue_url,html_url,repository_url,body"
}


export function isComment(o:any):o is IComment {
	return getValue(() => ["issue_id","issue_url"].every(prop => isDefined(o[prop])))
}
