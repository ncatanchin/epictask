import {
  ISearchChip, ISearchChipData,
  ISearchChipType,
  ISearchFilter,
  OrderByFilter,
  SearchProvider,
  SortFilter,
  TextFilter
} from "./Search"

import {flatten} from "lodash"
import {IIssue, IssueState} from "common/models/Issue"
import {ILabel} from "common/models/Label"
import {ICollaborator} from "common/models/Repo"
import {getValue} from "typeguard"
import {IMilestone} from "common/models/Milestone"
import db from "renderer/db/ObjectDatabase"
import getLogger from "common/log/Logger"

const log = getLogger(__filename)

export type IssueSearchChip<PK = string,V = any> = ISearchChip<IIssue,PK,V>

export type IssueStateValue = Array<IssueState | "all">

export class IssueStateChip implements IssueSearchChip<string,IssueStateValue> {

  readonly type = this.constructor.name

  get id():string {
    return `state-${this.type}-${this.value.join('-')}`
  }

  get valueAsString():string {
    return this.value.join(", ")
  }

  constructor(
    public filter:ISearchFilter<IIssue, string, IssueStateValue>,
    public key:"state",
    public value:IssueStateValue
  ) {

  }

  get description():string {
    return `Issue is ${this.value.join(", ")}`
  }

  data() {
    return {
      type: this.type,
      key: this.key,
      value: this.value
    }
  }
}

export class IssueLabelChip implements IssueSearchChip<string,ILabel> {

  readonly type = this.constructor.name

  get id():string {
    return `label-${this.type}-${this.value.id}`
  }

  get valueAsString():string {
    return this.value.name
  }

  get color():string {
    return `#${this.value.color}`
  }

  constructor(
    public filter:ISearchFilter<IIssue, string,ILabel>,
    public key:"label",
    public value:ILabel
  ) {

  }

  get description():string {
    return `Issue has label ${this.value.name}`
  }

  data() {
    return {
      type: this.type,
      key: this.key,
      value: this.value
    }
  }
}

export class IssueAssigneeChip implements IssueSearchChip<string,ICollaborator> {

  readonly type = this.constructor.name

  get id():string {
    return `assignee-${this.type}-${this.value.login}`
  }
  get valueAsString():string {
    return this.value.login
  }

  constructor(
    public filter:ISearchFilter<IIssue, string,ICollaborator>,
    public key:"assignee",
    public value:ICollaborator
  ) {

  }

  get description():string {
    return `Assigned to ${this.value.login}`
  }

  data() {
    return {
      type: this.type,
      key: this.key,
      value: this.value
    }
  }
}

export class IssueMilestoneChip implements IssueSearchChip<string,IMilestone> {

  readonly type = this.constructor.name

  get id():string {
    return `milestone-${this.type}-${this.value.id}`
  }

  constructor(
    public filter:ISearchFilter<IIssue, string,IMilestone>,
    public key:"milestone",
    public value:IMilestone
  ) {

  }

  get description():string {
    return `In milestone ${this.value.title}`
  }

  get valueAsString():string {
    return this.value.title
  }

  data() {
    return {
      type: this.type,
      key: this.key,
      value: this.value
    }
  }
}

class IssueStateFilter implements ISearchFilter<IIssue, string, IssueStateValue,any> {

  supportedChips:Array<ISearchChipType> = [IssueStateChip]

  name:string = this.constructor.name

  hydrate(data:ISearchChipData<IssueStateValue>):IssueStateChip {
    return new IssueStateChip(this,"state",data.value)
  }

  filter(chips:Array<ISearchChip<IIssue, string, IssueStateValue>>, results:IIssue[]):IIssue[] {
    const stateChips = chips.filter(chip => chip instanceof IssueStateChip)

    if (stateChips.length) {
      results = results.filter(result => stateChips.some(chip => chip.value.includes(result.state)))
    }

    return  results
  }

  searchChips(text:string):Array<IssueStateChip> {
    return flatten([
      (["all","open","closed"] as IssueStateValue)
        .filter(state => state.toLowerCase().includes(text.toLowerCase()))
        .map(state =>
          new IssueStateChip(this as any, 'state', state === 'all' ? ["closed","open"] : [state])
        )
    ])
  }
}


class IssueLabelFilter implements ISearchFilter<IIssue, string, ILabel> {

  supportedChips = [IssueLabelChip]

  name:string = this.constructor.name

  hydrate(data:ISearchChipData<ILabel>):IssueLabelChip {
    return new IssueLabelChip(this,"label",data.value)
  }

  filter(chips:Array<ISearchChip<IIssue, string, ILabel>>, results:IIssue[]):IIssue[] {
    const labelNames = chips
      .filter(chip => chip instanceof IssueLabelChip)
      .map(chip => chip.value.name)

    //log.info("Filter labels",labelNames,chips)
    if (labelNames.length) {
      results = results.filter(result => {
        const resultLabelNames = result.labels.map(label => label.name)
        return resultLabelNames.length &&
          resultLabelNames.every(name => labelNames.includes(name))
      })
    }

    return  results
  }

  searchChips(text:string):Array<IssueLabelChip> {
    return flatten([
      getStoreState().DataState.labels.data
        .filter(label => label.name.toLowerCase().includes(text.toLowerCase()))
        .map(label =>
          new IssueLabelChip(this, 'label', label)
        )
    ])
  }
}


class IssueAssigneeFilter implements ISearchFilter<IIssue, string, ICollaborator> {

  supportedChips = [IssueAssigneeChip]

  name:string = this.constructor.name

  hydrate(data:ISearchChipData<ICollaborator>):IssueAssigneeChip {
    return new IssueAssigneeChip(this,"assignee",data.value)
  }

  filter(chips:Array<ISearchChip<IIssue, string, ICollaborator>>, results:IIssue[]):IIssue[] {
    const assignees =
      chips
        .filter(chip => chip instanceof IssueAssigneeChip)
        .map(chip => chip.value.id)

    if (assignees.length) {
      results = results.filter(result =>
        assignees.some(id =>
          [
            getValue(() => result.assignee.id),
            ...(result.assignees ||[]).map(it => it.id)
          ].map(it => getValue(() => it,null))
            .includes(id)))
    }

    return  results
  }

  searchChips(text:string):Array<IssueAssigneeChip> {
    return flatten([
      getStoreState().DataState.collaborators.data
        .filter(assignee => assignee.login.toLowerCase().includes(text.toLowerCase()))
        .map(assignee =>
          new IssueAssigneeChip(this as any, 'assignee', assignee)
        )
    ])
  }
}

class IssueMilestoneFilter implements ISearchFilter<IIssue, string, IMilestone> {

  supportedChips = [IssueMilestoneChip]

  name:string = this.constructor.name

  hydrate(data:ISearchChipData<IMilestone>):IssueMilestoneChip {
    return new IssueMilestoneChip(this as any,"milestone",data.value)
  }

  filter(chips:Array<ISearchChip<IIssue, string, IMilestone>>, results:IIssue[]):IIssue[] {
    const milestones =
      chips
        .filter(chip => chip instanceof IssueMilestoneChip)
        .map(chip => chip.value.id)

    if (milestones.length) {
      results = results.filter(result =>
        milestones.some(id => getValue(() => result.milestone.id === id))
      )
    }

    return  results
  }

  searchChips(text:string):Array<IssueMilestoneChip> {
    return flatten([
      getStoreState().DataState.milestones.data
        .filter(milestone => milestone.title.toLowerCase().includes(text.toLowerCase()))
        .map(milestone =>
          new IssueMilestoneChip(this as any, 'milestone', milestone)
        )
    ])
  }
}





type DB = typeof db

const issueSearchProvider = new SearchProvider<DB,"issues",IIssue,string>(db,'issues', [
  new IssueStateFilter(),
  new IssueMilestoneFilter(),
  new IssueAssigneeFilter(),
  new IssueLabelFilter(),
  new TextFilter(['body','title']),
  new OrderByFilter(['created_at','updated_at','title','body'],'created_at'),
  new SortFilter()
], new IssueStateChip(new IssueStateFilter(),"state",["open"]))


export default issueSearchProvider
