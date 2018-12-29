
import {IssuesCreateResponse} from "@octokit/rest"
import {ILabel} from "renderer/models/Label"

export interface IIssue extends IssuesCreateResponse {
	labels: Array<ILabel>
}

export const IssueIndexes = {
	v1: "&id,repository_url,assignee,assignees,milestone,title,body,labels"
}
