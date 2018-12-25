
import {
	OrgsListForAuthenticatedUserResponseItem
} from "@octokit/rest"

export interface IOrg extends OrgsListForAuthenticatedUserResponseItem {

}

export const OrgIndexes = {
	v1: "&id,&login,&url,description"
}
