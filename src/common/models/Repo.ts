
import {ReposListForOrgResponseItem,ReposListPublicResponseItem} from "@octokit/rest"

export interface IRepo extends ReposListPublicResponseItem, ReposListForOrgResponseItem {

}

export const RepoIndexes = {
	v1: "&id,url,name,full_name"
}
