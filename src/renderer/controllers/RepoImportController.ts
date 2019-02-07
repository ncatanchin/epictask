import * as React from 'react'

import Controller from "renderer/controllers/Controller"
import getLogger from "common/log/Logger"
import {IRepo} from "common/models/Repo"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import db from "renderer/db/ObjectDatabase"
import {setStatusMessage} from "common/util/AppStatusHelper"
import getRepoObjectManager from "renderer/db/RepoObjectManager"
import EventHub from "common/events/Event"
import delay from "common/util/Delay"

const log = getLogger(__filename)

export interface IRepoSearchResult {
  local: boolean
  repo: IRepo
}

export default class RepoImportController extends Controller {


  repos:Array<IRepoSearchResult> = []
  repo:IRepoSearchResult | null = null
  query:string = ""

  constructor() {
    super()
  }

  async onImport():Promise<IRepo> {
    if (!this.repo) throw Error("Repo not selected")

    const repo = this.repo.repo
    log.info("Importing repo", repo)
    setStatusMessage(`Importing ${repo.full_name}`)
    const repoObjectManager = await getRepoObjectManager()
    await repoObjectManager.save(repo)
    EventHub.emit("ReposUpdated")
    await delay(250)
    new AppActionFactory().setSelectedRepo(this.repo.repo)
    return this.repo.repo
  }

  setQuery(query:string):this {
    this.query = query
    return this
  }

  setRepos(repos:Array<IRepoSearchResult>):this {
    this.repos = repos
    return this
  }

  setRepo(repo:IRepoSearchResult | null):this {
    this.repo = repo
    return this
  }

}

export const RepoImportContext = React.createContext<RepoImportController | null>(null)
