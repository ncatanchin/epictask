
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

	const objectId = !groupByItem ? 'none' :
		(Array.isArray(groupByItem)) ?
			groupByItem.map(item => _.toLower(item.url))
				.sort()
				.join('-') :
			(groupByItem.id || groupByItem.url)



	return `${groupBy}-${objectId}`
}

export default IIssueGroup