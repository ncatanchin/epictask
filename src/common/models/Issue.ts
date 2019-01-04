
import {IssuesCreateResponse} from "@octokit/rest"
import {ILabel} from "common/models/Label"

export interface IIssue extends IssuesCreateResponse {
	labels: Array<ILabel>
}

export const IssueIndexes = {
	v1: "&id,repository_url,title,body"
}
