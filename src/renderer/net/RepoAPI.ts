import {IRepo} from "renderer/models/Repo"
import {getAPI} from "renderer/net/GithubAPI"


export async function getRepo(owner:string, name:string):Promise<IRepo> {
  const gh = getAPI()
  return (await gh.repos.get({
    owner,
    repo:name
  })).data as IRepo
}
