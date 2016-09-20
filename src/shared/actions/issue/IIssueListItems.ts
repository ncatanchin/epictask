import {Map} from 'immutable'
import {TIssueFieldsGroupable} from 'shared/actions/issue/IIssueSort'
import {Issue} from 'shared/models/Issue'


export interface IIssueGroup {
	id:string
	issueIndexes:number[]
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

/**
 * List item types
 */
export enum IssueListItemType {
	Issue = 1,
	Group
}

/**
 * All items for issue list,
 * created by selector
 */
export interface IIssueListItem<T extends Issue|IIssueGroup> {
	type:IssueListItemType
	id:string|number
	item:T
}

export function isGroupListItem(item:IIssueListItem<any>):item is IIssueListItem<IIssueGroup> {
	return item.type === IssueListItemType.Group
}


export function isGroupVisible(groupVisibility:Map<string,boolean>, id:string) {
	return groupVisibility.has(id) ? groupVisibility.get(id) : true
}

