
import {TIssueFieldsGroupable} from 'shared/actions/issue/IIssueSort'
import {Issue} from 'shared/models/Issue'

export interface IIssueGroup {
	id:string
	issues:Issue[]
	size:number
	index:number
	groupBy: TIssueFieldsGroupable
	groupByItem: any
}

export function getIssueGroupId({groupBy,groupByItem}) {

	const objectId = (!groupByItem || groupByItem.length === 0) ?
		'' :
		(Array.isArray(groupByItem)) ?
			groupByItem.map(item => _.toLower(item.name))
				.sort()
				.join('-') :
			(groupByItem.title || groupByItem.name)



	return _.toLower(`${groupBy}-${objectId}`)
}

export default IIssueGroup