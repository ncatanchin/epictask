import {IssuesCreateResponseMilestone} from "@octokit/rest"


export interface IMilestone extends IssuesCreateResponseMilestone {
  repository_url:string
}

export const MilestoneIndexes = {
	v1: "&id,repository_url,url,title"
}
