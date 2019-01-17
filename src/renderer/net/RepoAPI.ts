import {IRepo} from "common/models/Repo"
import {getAPI} from "renderer/net/GithubAPI"
import {ILabel} from "common/models/Label"
import {IMilestone} from "common/models/Milestone"

export function getRepoParams(repo:IRepo):{owner:string,repo:string} {
  return {
    owner: repo.owner.login,
    repo: repo.name
  }
}


export async function getRepo(owner:string, name:string):Promise<IRepo> {
  const gh = getAPI()
  return (await gh.repos.get({
    owner,
    repo:name
  })).data as IRepo
}


export async function getLabels(repo:IRepo):Promise<Array<ILabel>> {
  const
    gh = getAPI(),
    repoParams = getRepoParams(repo)

  return (await (gh as any).paginate((gh as any).issues.listLabelsForRepo.endpoint.merge(repoParams)) as Array<ILabel>)
    .map(label => ({...label,repository_url: repo.url} as ILabel))
}


export async function getMilestones(repo:IRepo):Promise<Array<IMilestone>> {
  const
    gh = getAPI(),
    repoParams = getRepoParams(repo)

  return (await (gh as any).paginate((gh as any).issues.listMilestonesForRepo.endpoint.merge(repoParams)) as Array<IMilestone>)
    .map(label => ({...label,repository_url: repo.url} as IMilestone))
}
