
import {TIssueFieldsGroupable} from 'shared/actions/issue/IIssueSort'
import {Issue} from 'shared/models/Issue'

export interface IIssueGroup {
	issues:Issue[]
	size:number
	index:number
	groupBy: TIssueFieldsGroupable
	groupByItem: any
}

export default IIssueGroup