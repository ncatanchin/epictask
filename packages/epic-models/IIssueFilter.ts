
import { DefaultIssueSort } from "./IIssueSort"
import { cloneObject } from "epic-global"

export const DefaultIssueFilter = {
	offset:0,
	limit:100,
	includeClosed: false
} as IIssueFilter

export const DefaultIssueCriteria = cloneObject(
	DefaultIssueFilter,
	{sort: DefaultIssueSort}
) as IIssueCriteria