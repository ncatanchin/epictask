
import {IssuesCreateResponse} from "@octokit/rest"

export interface IIssue extends IssuesCreateResponse {

}

export const IssueIndexes = {
	v1: "&id,repository_url,assignee,assignees,milestone,title,body,labels"
}
