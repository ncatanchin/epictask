import {IRepo} from "common/models/Repo"
import {getAPI} from "renderer/net/GithubAPI"
import {ILabel} from "common/models/Label"
import {IMilestone} from "common/models/Milestone"
import {IRepoSearchResult} from "renderer/controllers/RepoImportController"
import * as FuzzySearch from 'fuzzy-search'
import {getLogger} from "typelogger"

const log = getLogger(__filename)

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


export async function searchGithubRepos(query:string):Promise<Array<IRepo>> {
  const gh = getAPI()
  return (await gh.search.repos({
    order: "desc",
    per_page: 20,
    page: 0,
    q: `in:name ${query}`
    //in:description
  })).data.items as Array<IRepo>
}

export async function searchRepos(query:string):Promise<Array<IRepoSearchResult>> {
  if (!query || query.length < 1) return []

  const
    localRepos = getRendererStoreState().DataState.repos.data,
    githubRepos = await searchGithubRepos(query)

  //log.info("Search local=",localRepos,"github=",githubRepos)

  const
    myRepos = localRepos.map(repo => ({local:true,repo})),
    otherRepos = githubRepos.map(repo => ({local:false,repo})),
    allRepos = [...myRepos,...otherRepos],
    //,'repo.description'
    searcher = new FuzzySearch(allRepos,['repo.full_name','repo.name'],{
      caseSensitive: false
    })

  return searcher.search(query)//.map(result => result.repo)
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
