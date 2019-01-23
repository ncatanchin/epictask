import {convertEnumValuesToString} from "common/ObjectUtil"

export enum CommandContainer {
  App,
  Settings,
  Dialog,
  IssuesLayout,
  IssueView,
  IssueEditForm,
  IssueList,
  RepoSelect
}

export const CommandContainerIds = convertEnumValuesToString(CommandContainer)

export default CommandContainerIds
