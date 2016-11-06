

import { DatabaseAdapter } from "epic-database-adapters/DatabaseAdapter"

let
	IssueViews = require("./IssueViews").default

const
	log = getLogger(__filename)


/**
 * Get the underlying pouch db
 *
 * @param repo
 * @returns {any}
 */
function getPouchDB(repo) {
	return repo.getPouchDB()
}


/**
 * Execute a direct db call
 *
 * @param store
 * @param name
 * @param args
 * @returns {any}
 */
function dbCall(store,name,...args) {
	return getPouchDB(store)[name](...args)
}


/**
 * Persist a set of views
 *
 * @param store
 * @param name
 * @param views
 */
async function persistViews(store,name,views) {
	const
		id = `_design/${name}`,
		existingDoc = await dbCall(store,'get',id),
		doc = {
			_id: id,
			views
		} as any
	
	if (existingDoc && existingDoc._rev)
		doc._rev = existingDoc._rev
	
	log.info(`${doc._rev ? 'Updating' : 'Creating'} ${id}`)
	await dbCall(store,'put',doc)
	log.info(`Persisted ${id}`)
}


// persistQueries(Stores.issue,'issues',IssueViews).then(() => {
// 	queryByMilestone()
//
// })

let
	_db:DatabaseAdapter


export default async function buildSchema(db:DatabaseAdapter) {
	_db = db
	
	const
		Stores = db.getStores()
	
	log.info(`Creating issue views`)
	await persistViews(Stores.issue,'issues',IssueViews)
	
}

if (module.hot) {
	module.hot.accept(['./IssueViews'], () => {
		IssueViews = require('./IssueViews').default
		
		if (_db) {
			buildSchema(_db)
		}
	})
}