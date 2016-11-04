
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
			repos = result.rows
				.filter(it => it.doc && it.doc.attrs)
				.map(it => it.doc.attrs.full_name)
		
		log.info(`Repos = `, repos.length)
	})
	
	
	await Benchmark('Walk allDocs, include_docs=false', async() => {
		
		const
			
			allDocs = await dbCall(Stores.issue, 'allDocs', {
				include_docs: false
			})
		log.info(`Docs = `, allDocs.rows.map(it => it.key).length)
	})
	
	
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

tests()