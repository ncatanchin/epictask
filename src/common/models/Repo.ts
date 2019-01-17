
import {
  ReposListBranchesResponseItem,
  ReposListCollaboratorsResponseItem,
  ReposListForOrgResponseItem,
  ReposListPublicResponseItem
} from "@octokit/rest"
import {IUser} from "common/models/User"

export interface IRepo extends ReposListPublicResponseItem, ReposListForOrgResponseItem {

}

export interface IBranch extends ReposListBranchesResponseItem {

}

export const RepoIndexes = {
	v1: "&id,url,name,full_name"
}


export interface ICollaborator extends IUser,ReposListCollaboratorsResponseItem {
	repository_url: string
}

export const CollaboratorIndexes = {
  v1: "[repository_url+login],repository_url"
}
