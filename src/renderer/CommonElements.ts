import {convertEnumValuesToString} from "common/ObjectUtil"

export enum CommonElement {
  App,
  Settings,
  Dialog,
  IssuesLayout,
  IssueView,
  IssueEditForm,
  IssueList,
  IssueSearch,
  RepoSelect,
  NotificationsList,
  LayoutSelector
}

export const CommonElementIds = convertEnumValuesToString(CommonElement)

export default CommonElementIds
