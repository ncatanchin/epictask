
import {IssuesAddLabelsResponseItem} from "@octokit/rest"

export interface ILabel extends IssuesAddLabelsResponseItem {
	repository_url:string
}

export const LabelIndexes = {
	v1: "&id,repository_url,name,description,color"
}
