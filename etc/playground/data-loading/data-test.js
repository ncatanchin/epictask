
let
	log = getLogger('data-test'),
	{isPromise} = require('typeguard')

	
async function tests() {
	
	await Benchmark('Issue count', async() => {
		console.log(`Issue count = ${await Stores.issue.count()}`)
	})
	
	await Benchmark('Get all repos', async() => {
		const
			result = await dbCall(Stores.repo, 'allDocs', {
				include_docs: true
			}),
			repos = rowsToObjects(result)
		
		log.info(`Repos = `, repos.length)
		console.table(repos.map(it => _.pick(it,'id','full_name')))
	})
	
	
	// await Benchmark('Walk allDocs, include_docs=false', async() => {
	//
	// 	const
	//
	// 		allDocs = await dbCall(Stores.issue, 'allDocs', {
	// 			include_docs: false
	// 		})
	// 	log.info(`Docs = `, allDocs.rows.map(it => it.key).length)
	// })
	
	
}






async function Benchmark(name,fn) {
	let
		startTime = Date.now()
	try {
		let
			result = fn()
		
		if (isPromise(result)) {
			await result
		}
	} catch (err) {
		log.error(`Failed`,err)
	}
	
	
	let
		endTime = Date.now()
	
	log.info(`"${name}" Duration: ${(endTime - startTime) / 1000}s`)
}

function dbCall(store,name,...args) {
	return ProcessConfig.isUI() ?
		store.db(name,...args) :
		getPouchDB(store)[name](...args)
}

function getPouchDB(repo) {
	return repo.getPouchDB()
}

function rowsToObjects(result) {
	return result.rows
		.filter(it => it.doc && it.doc.attrs)
		.map(it => it.doc.attrs)
}
//tests()


const queryByMilestone = () => Benchmark('Query by milestone',async () => {
	const result = await dbCall(Stores.issue,'query','issues/byMilestones',{
		reduce: true,
		group: true,
		group_level: 1,
		key: [58922079]
		// startkey: [58922079],
		// endkey: [58922079,{}]
	})
	console.log(result)
})


const queryByLabels = () => Benchmark('Query by labels',async () => {
	const result = await dbCall(Stores.issue,'query','issues/byLabels',{
		reduce: true,
		group: true,
		group_level: 1,
		key: [58922079]
		//startkey: [58922079],
		// endkey: [58922079,{}]
	})
	console.log(result)
})



const queryByAssignees = () => Benchmark('Query by assignees',async () => {
	const result = await dbCall(Stores.issue,'query','issues/byAssignees',{
		reduce: true,
		group: true,
		group_level: 1,
		//key: [58922079]
		//startkey: [58922079],
		// endkey: [58922079,{}]
	})
	console.log(result)
})







const queryWithSortFields = () => Benchmark('Query with sort fields',async () => {
	const result = await dbCall(Stores.issue,'query','issues/withSortFields',{
		reduce: true,
		//group: true,
		//group_level: 1,
		keys: [[58922079],[3277032]]
		//startkey: [58922079],
		// endkey: [58922079,{}]
	})
	console.log(result)
})

const allIssues = () => Benchmark('All issues',async () => {
	const result = await dbCall(Stores.issue,'allDocs',{
		include_docs:true
	})
	console.log(result)
})

async function multiTest() {
	for (let i = 0; i < 1;i++) {
		await queryByLabels()
		await queryByMilestone()
		await queryByAssignees()
	}
		
}


//allIssues()
queryWithSortFields()
//multiTest()
//queryByAssignees()
async function persistQueries(store,name,views) {
	const
		id = `_design/${name}`,
		existingDoc = await dbCall(store,'get',id)
	
	
	const
		doc = {
			_id: id,
			views
		}
		
	if (existingDoc && existingDoc._rev)
		doc._rev = existingDoc._rev
	
	log.info(`Creating ${id}`)
	await dbCall(store,'put',doc)
	log.info(`Created ${id}`)
}

//
// persistQueries(Stores.issue,'issues',{
// 	byMilestones: {
// 		map: function map (doc) {
// 			if (doc && doc.attrs) {
//
// 				let
// 					attrs = doc.attrs,
// 					milestoneId = (attrs.milestone && attrs.milestone.id) || '0',
// 					creator = attrs.user && attrs.user.login,
// 					assignee = attrs.assignee && attrs.assignee.login
//
// 				emit([attrs.repoId,milestoneId,attrs.state,creator,assignee,attrs.updated_at,attrs.created_at],doc._id)
// 			}
//
// 		}.toString(),
//
// 		reduce: function (keys,values,rereduce) {
// 			return values
// 		}.toString()
// 	}
// }).then(() => {
// 	queryByMilestone()
//
// })

// queryByMilestone().then(() => queryByMilestone())
//
// dbCall(Stores.issue, 'query', def,{
// 	reduce: true,
// 	group: true,
// 	group_level: 2,
// 	startkey: [58922079],
// 	endkey: [58922079,{}],
//
//
// }).then(console.log)


// dbCall(Stores.user, 'allDocs', {
//  	include_docs: true
// }).then(rowsToObjects).then(objs => objs.filter(it => it.login === 'jglanz')).then(console.log)
//Stores.repo.findWithText('epic').then(console.log)
//Stores.user.findByLogin('jglanz').then(console.log)


//
// dbCall(Stores.issue, 'query', {
// 	map: (doc,emit) => {
// 		if (doc && doc.attrs) {
//
// 			let
// 				attrs = doc.attrs,
// 				labelIds = !attrs.labels ? [] : attrs.labels.map(label => label.id)
//
// 			emit([attrs.repoId],labelIds)
// 		}
// 	},
// 	reduce: function (keys,values,rereduce) {
// 		const
// 			labelMap = {}
//
// 		let
// 			repoId,
// 			issueId,
// 			issueLabelIds,
// 			labelIds,
// 			labelKey
//
// 		keys.forEach((key,index) => {
// 			repoId = key[0]
// 			issueId = key[1]
// 			issueLabelIds = values[index]
//
// 			for (let labelId of issueLabelIds) {
// 				if (typeof labelId === 'number') {
// 					labelKey = `${repoId}-${labelId}`
// 					labelIds = labelMap[labelKey]
// 					if (!labelIds) {
// 						labelMap[labelKey] = labelIds = []
// 					}
//
// 					if (labelIds.indexOf(issueId) === -1)
// 						labelIds.push(issueId)
// 				}
// 			}
//
//
//
// 		})
//
// 		return labelMap
// 	}
// },{
// 	reduce: true,
// 	group: true,
// 	group_level: 1,
// 	// key: [58922079]
// 	startkey: [38366638],
// 	endkey: [58922079],
//
//
//
// }).then(console.log)
