declare global {
	function emit(...args)
}

const
	reduceIds = function (keys, values, rereduce) {
		return values
	}.toString()


const
	SortFieldsTemplate = `[
		doc._id,
		attrs.id,
		attrs.repoId,
		attrs.number,
		attrs.title,
		attrs.state,
		!attrs.labels ? null : attrs.labels.map(it => it.id).join(','),  
		attrs.milestone && attrs.milestone.id,
		attrs.milestone && attrs.milestone.title,
		attrs.user && attrs.user.id,
		attrs.user && attrs.user.login,
		attrs.assignee && attrs.assignee.id,
		attrs.assignee && attrs.assignee.login,
		attrs.updated_at,
		attrs.created_at,
		attrs.focused
	]`


const reduceIssuesToMap = function (keys, values, rereduce) {
	const
		issueMap = {}
	
	let
		repoId,
		issueId,
		issuePropIds,
		propValueIds,
		propValueKey,
		issueInfo,
		issueSortFields
	
	keys.forEach((key, index) => {
		repoId = key[ 0 ]
		issueId = key[ 1 ]
		issueInfo = values[ index ]
		issueSortFields = issueInfo[0]
		issuePropIds = issueInfo[1]
		for (let propValueId of issuePropIds) {
			if (typeof propValueId === 'number') {
				propValueKey = `${repoId}-${propValueId}`
				propValueIds = issueMap[ propValueKey ]
				if (!propValueIds) {
					issueMap[ propValueKey ] = propValueIds = []
				}
				
				if (propValueIds.indexOf(issueSortFields) === -1)
					propValueIds.push(issueSortFields)
			}
		}
		
		
	})
	
	return issueMap
}.toString()


const IssueViews = {
	
	withSortFields: {
		map: `function(doc) {
			if (doc && doc.attrs) {
				
				let
					attrs = doc.attrs,
					sortFields = ${SortFieldsTemplate}
				
				emit([ attrs.repoId ], [sortFields])
			}
		}`
	},
	
	byLabels: {
		map: `function(doc) {
			if (doc && doc.attrs) {
				
				let
					attrs = doc.attrs,
					labelIds = !attrs.labels ? [] : attrs.labels.map(label => label.id),
					sortFields = ${SortFieldsTemplate}
				
				emit([ attrs.repoId ], [sortFields,labelIds])
			}
		}`,
		reduce: reduceIssuesToMap
	},
	
	// BY ASSIGNEE
	byAssignees: {
		map: `function(doc) {
			if (doc && doc.attrs) {
				
				let
					attrs = doc.attrs,
					assigneeId = (attrs.assignee && attrs.assignee.id) || 0,
					sortFields = ${SortFieldsTemplate}
				
				emit([ attrs.repoId ], [sortFields,[assigneeId]])
			}
		}`,
		reduce: reduceIssuesToMap
	},
	
	byMilestones: {
		map: `function (doc) {
			if (doc && doc.attrs) {
				
				let
					attrs = doc.attrs,
					milestoneId = (attrs.milestone && attrs.milestone.id) || 0,
					sortFields = ${SortFieldsTemplate}
				
				emit([ attrs.repoId], [sortFields,[milestoneId]])
			}
			
		}`,
		
		reduce: reduceIssuesToMap
	},
	
	byFocused: {
		map: `function (doc) {
			if (doc && doc.attrs && doc.attrs.focused === true) {
				
				let
					attrs = doc.attrs,
					sortFields = ${SortFieldsTemplate}
				
				emit([ attrs.repoId], [sortFields,[true]])
			}
			
		}`,
		
		reduce: reduceIssuesToMap
	}
	
	
}

export default IssueViews