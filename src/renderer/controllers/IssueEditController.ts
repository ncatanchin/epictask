import * as React from 'react'

import Controller from "renderer/controllers/Controller"
import {IIssue} from "common/models/Issue"
import {getValue} from "typeguard"
import {IssuesUpdateParams} from "@octokit/rest"
import * as _ from "lodash"
import {createIssue, patchIssue} from "renderer/net/IssueAPI"
import getLogger from "common/log/Logger"
import {IRepo} from "common/models/Repo"

const log = getLogger(__filename)

export default class IssueEditController extends Controller {

  defaultPatch: Partial<IssuesUpdateParams>
  patch: Partial<IssuesUpdateParams>

  defaultBody: string

  private makeDefaultBody(): string {
    return getValue(() => this.issue && this.issue.body, "")
  }

  private makeDefaultPatch(): Partial<IssuesUpdateParams> {
    return ({
      body: this.makeDefaultBody(),
      title: getValue(() => this.issue && this.issue.title, ""),
      assignees: (getValue(() => this.issue.assignees.length > 0,false) ?
        getValue(() => this.issue.assignees.map(assignee => assignee.login), []) :
        getValue(() => [this.issue.assignee.login], []))
        .filterNotNull(),
      milestone: getValue(() => this.issue.milestone.number, null),
      labels: getValue(() => this.issue.labels.map(label => label.name), [])
    })
  }


  constructor(public issue: IIssue = null) {
    super()
    this.defaultPatch = this.makeDefaultPatch(),
      this.defaultBody = this.makeDefaultBody()
    this.patch = this.makeDefaultPatch()
  }

  async onSave(repo:IRepo):Promise<IIssue> {
    const
      defaultPatch = this.defaultPatch,
      patch = {...this.patch}

    // WE ONLY USE ASSIGNEES - NEW PROP
    delete patch.assignee
    delete defaultPatch.assignee

    Object.keys(defaultPatch).forEach(key => {
      if (_.isEqual(defaultPatch[key],patch[key])) {
        delete patch[key]
      }
    })

    log.info("Saving",repo,this.issue,patch,defaultPatch,patch)
    if (this.issue) {
      return await patchIssue(this.issue, patch)
    } else {
      return await createIssue(repo,patch as any)
    }
  }

  setPatch(patchFn: (patch: Partial<IssuesUpdateParams>) => Partial<IssuesUpdateParams>): this {
    const patch = {
      ...this.patch,
      ...patchFn(this.patch)
    }

    return Object.assign(this.clone(), {
      patch
    })
  }
}

export const IssueEditContext = React.createContext<IssueEditController | null>(null)
