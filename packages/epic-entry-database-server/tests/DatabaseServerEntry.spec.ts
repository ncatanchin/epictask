/**
 * Created by jglanz on 1/31/17.
 */

import 'epic-tests/TestSetup'

import {DatabaseServerEntry} from 'epic-entry-database-server'
import { Repo } from "epic-models"


const
	log = getLogger(__filename)


let
	dbEntry:DatabaseServerEntry = null


function getDatabaseClient():IDatabaseClient {
	return require('epic-database-client').getDatabaseClient()
}

function getStores():IStores {
	return getDatabaseClient().getStores()
}

/**
 * Start/Create new DB instance
 *
 * @returns {Promise<DatabaseServerEntry>}
 */
async function startDB() {
	await stopDB()
	
	//clearRequireCache('epic-entry-database-server')
	const
		DatabaseServerEntryClazz = require('epic-entry-database-server').DatabaseServerEntry as typeof DatabaseServerEntry
	
	DatabaseServerEntryClazz.resetEntry()
	
	dbEntry = new DatabaseServerEntryClazz()
	
	await dbEntry.launch()
	
	expect(dbEntry.running).toBe(true)
	return dbEntry
}

/**
 * Stop and clear database
 *
 * @returns {Promise<void>}
 */
async function stopDB() {
	if (!dbEntry)
		return
	
	try {
		await dbEntry.kill()
	} catch (err) {
		log.error(`Failed to shutdown db server`,err)
	} finally {
		dbEntry = null
	}
}

/**
 * before each, create db instance
 */
beforeEach(startDB)

/**
 * After each kill the instance
 */
afterEach(stopDB)

/**
 * Start/Stop
 */
test('Start & Stop DB Server',async () => {
	expect(dbEntry.running).toBe(true)
})

/**
 * Create a Repo Object
 */
test(`Create Repo`,async () => {
	const
		repo = new Repo({
			id: 1,
			organization: {
				id: 1,
				login: __filename,
				name: __filename
			},
			full_name: "test/test1",
			fork: false,
			name: 'test1',
			description: 'test1'
		})
	
	let
		savedRepo = await getStores().repo.save(repo)
	
	expect(repo).not.toBe(savedRepo)
	expect((repo as any).$$doc).toBeUndefined()
	expect((savedRepo as any).$$doc).toBeDefined()
})




/**
 * Add model store
 */

test(`Add model at runtime`,async () => {
	const
		client = getDatabaseClient()
	
	
})

//export {}