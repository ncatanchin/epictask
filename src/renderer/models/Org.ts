
import {
	OrgsListForAuthenticatedUserResponseItem
} from "@octokit/rest"

export interface IOrg extends OrgsListForAuthenticatedUserResponseItem {
	personal?:boolean
}

export const OrgIndexes = {
	v1: "&id,&login,&url,description"
}


