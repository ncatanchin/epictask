declare global {
	function emit(...args)
}

const
	reduceIds = function (keys, values, rereduce) {
		return values
	}.toString()


const reduceIssuesToMap = function (keys, values, rereduce) {
	const
		labelMap = {}
	
	let
		repoId,
		issueId,
		issueLabelIds,
		labelIds,
		labelKey,
		issueInfo,
		issueSortFields
	
	keys.forEach((key, index) => {
		repoId = key[ 0 ]
		issueId = key[ 1 ]
		issueInfo = values[ index ]
		issueSortFields = issueInfo[0]
		issueLabelIds = issueInfo[1]
		for (let labelId of issueLabelIds) {
			if (typeof labelId === 'number') {
				labelKey = `${repoId}-${labelId}`
				labelIds = labelMap[ labelKey ]
				if (!labelIds) {
					labelMap[ labelKey ] = labelIds = []
				}
				
				if (labelIds.indexOf(issueSortFields) === -1)
					labelIds.push(issueSortFields)
			}
		}
		
		
	})
	
	return labelMap
}.toString()


const IssueViews = {
	
	withSortFields: {
		map: function(doc) {
			if (doc && doc.attrs) {
				
				let
					attrs = doc.attrs,
					sortFields = [
						doc._id,
						attrs.id,
						attrs.repoId,
						attrs.title,
						attrs.state,
						attrs.milestone && attrs.milestone.id,
						attrs.milestone && attrs.milestone.title,
						attrs.user && attrs.user.id,
						attrs.user && attrs.user.login,
						attrs.assignee && attrs.assignee.id,
						attrs.assignee && attrs.assignee.login,
						attrs.updated_at,
						attrs.created_at
					]
				
				emit([ attrs.repoId ], [sortFields])
			}
		}.toString()
	},
	
	byLabels: {
		map: function(doc) {
			if (doc && doc.attrs) {
				
				let
					attrs = doc.attrs,
					labelIds = !attrs.labels ? [] : attrs.labels.map(label => label.id),
					sortFields = [
						doc._id,
						attrs.id,
						attrs.repoId,
						attrs.title,
						attrs.state,
						attrs.milestone && attrs.milestone.id,
						attrs.milestone && attrs.milestone.title,
						attrs.user && attrs.user.id,
						attrs.user && attrs.user.login,
						attrs.assignee && attrs.assignee.id,
						attrs.assignee && attrs.assignee.login,
						attrs.updated_at,
						attrs.created_at
					]
				
				emit([ attrs.repoId ], [sortFields,labelIds])
			}
		}.toString(),
		reduce: reduceIssuesToMap
	},
	
	// BY ASSIGNEE
	byAssignees: {
		map: function(doc) {
			if (doc && doc.attrs) {
				
				let
					attrs = doc.attrs,
					assigneeId = (attrs.assignee && attrs.assignee.id) || 0,
					sortFields = [
						doc._id,
						attrs.id,
						attrs.repoId,
						attrs.title,
						attrs.state,
						attrs.milestone && attrs.milestone.id,
						attrs.milestone && attrs.milestone.title,
						attrs.user && attrs.user.id,
						attrs.user && attrs.user.login,
						attrs.assignee && attrs.assignee.id,
						attrs.assignee && attrs.assignee.login,
						attrs.updated_at,
						attrs.created_at
					]
				
				emit([ attrs.repoId ], [sortFields,[assigneeId]])
			}
		}.toString(),
		reduce: reduceIssuesToMap
	},
	
	byMilestones: {
		map: function (doc) {
			if (doc && doc.attrs) {
				
				let
					attrs = doc.attrs,
					milestoneId = (attrs.milestone && attrs.milestone.id) || 0,
					sortFields = [
						doc._id,
						attrs.id,
						attrs.repoId,
						attrs.title,
						attrs.state,
						attrs.milestone && attrs.milestone.id,
						attrs.milestone && attrs.milestone.title,
						attrs.user && attrs.user.id,
						attrs.user && attrs.user.login,
						attrs.assignee && attrs.assignee.id,
						attrs.assignee && attrs.assignee.login,
						attrs.updated_at,
						attrs.created_at
					]
					// creator = attrs.user && attrs.user.login,
					// assignee = attrs.assignee && attrs.assignee.login
				
				emit([ attrs.repoId], [sortFields,[milestoneId]])
			}
			
		}.toString(),
		
		reduce: reduceIssuesToMap
	}
	
	
}

export default IssueViews