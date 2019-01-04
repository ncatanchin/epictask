
import {ReposListForOrgResponseItemOwner,UsersListResponseItem} from "@octokit/rest"

export interface IUser extends ReposListForOrgResponseItemOwner, UsersListResponseItem {

}

export const UserIndexes = {
	v1: "&id,login,url,name,type"
}
