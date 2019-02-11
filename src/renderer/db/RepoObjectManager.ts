import ObjectManager, {ObjectEvent} from "./ObjectManager"
import {IRepo} from "common/models/Repo"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {getAPI} from "../net/GithubAPI"
import {ReposListForUserParams} from "@octokit/rest"
import {guard} from "typeguard"
import {AppState} from "common/store/state/AppState"
import {IUser} from "common/models/User"
import * as _ from 'lodash'
import * as BBPromise from 'bluebird'
import {getRepo} from "renderer/net/RepoAPI"
import {APIConcurrency} from "common/Constants"
import {nextTick} from "typedux"

const log = getLogger(__filename)

class RepoObjectManager extends ObjectManager<IRepo, number> {


  constructor() {
    super(db.repos)

    getStore().observe([AppState.Key, 'user'], (user:IUser | null) => {
      if (user) {
        guard(() => this.sync())
      }
    })

    guard(() => this.sync())

  }

  async clear():Promise<any> {
    return undefined;
  }

  getPrimaryKey(o:IRepo):number {
    return o.id
  }

  onChange(o:IRepo) {
  }

  onRemove(key:number) {
  }


  protected async doSync(...keys:number[]):Promise<boolean> {
    try {
      const
        gh = getAPI(),
        state = getStoreState(),
        {user} = state.AppState,
        orgs = await db.orgs.toArray(),
        existingRepos = await this.all()

      if (!user) {
        log.warn("Can not sync repos, not authenticated")
        return false
      }

      //log.info("Loading repos for orgs", orgs)

      const
        syncedAt = Date.now(),
        personalRepos = ((gh as any).paginate((gh.repos.listForUser as any).endpoint.merge({
          username: user.login
        } as ReposListForUserParams) as Promise<IRepo[]>)),
        orgRepos = (orgs.filter(org => !org.personal).map(org => (gh as any)
          .paginate("GET /orgs/:org/repos", {org: org.login}) as Promise<IRepo[]>) as Array<Promise<IRepo[]>>),
        repos = _.flatten(await Promise.all([
          personalRepos,
          ...orgRepos
        ])) as Array<IRepo>,
        remainingRepos = existingRepos.filter(existingRepo => !repos.find(repo => repo.id === existingRepo.id)),
        otherRepos = await BBPromise.map(
          remainingRepos,
          (repo:IRepo) => getRepo(repo.owner.login,repo.name),
          {concurrency: APIConcurrency}
        )

      repos.push(...otherRepos)

      //log.info(`Loaded ${repos.length} repos`)
      await this.table.bulkPut(repos)
      this.emit(ObjectEvent.Synced, syncedAt, repos)
      return true
    } catch (err) {
      log.error("Unable to sync repos", err)
      return false
    }
  }
}

let repoObjectManager:RepoObjectManager | null = null

export default function get():RepoObjectManager {
  if (!repoObjectManager)
    repoObjectManager = new RepoObjectManager()

  return repoObjectManager
}


