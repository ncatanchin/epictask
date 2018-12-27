import ObjectManager, {ObjectEvent} from "./ObjectManager"
import {IRepo} from "../models/Repo"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {getAPI} from "../net/GithubAPI"
import {ReposListForUserParams} from "@octokit/rest"
import {guard} from "typeguard"
import {AppState} from "../store/state/AppState"
import {IUser} from "../models/User"
import * as _ from 'lodash'

const log = getLogger(__filename)

class RepoObjectManager extends ObjectManager<IRepo, number> {
  
  private syncing = false
  
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
  
  
  async sync(...keys:number[]):Promise<boolean> {
    if (this.syncing) return true
    this.syncing = true
    try {
      const
        gh = getAPI(),
        state = getStoreState(),
        {user} = state.AppState,
        orgs = await db.orgs.toArray()//state.DataState.orgs.data
      
      if (!user) {
        log.warn("Can not sync repos, not authenticated")
        return false
      }
      
      log.info("Loading repos for orgs", orgs)
      
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
        ])) as Array<IRepo>
      
      
      log.info(`Loaded ${repos.length} repos`)
      await this.table.bulkPut(repos)
      this.emit(ObjectEvent.Synced, syncedAt, repos)
      return true
    } catch (err) {
      log.error("Unable to sync repos", err)
      return false
    } finally {
      this.syncing = false
    }
  }
}

let repoObjectManager:RepoObjectManager | null = null

export default function get():RepoObjectManager {
  if (!repoObjectManager)
    repoObjectManager = new RepoObjectManager()
  
  return repoObjectManager
}


