import {ServerEntry} from 'server/ServerEntry'
import {ServerClient} from 'shared/server/ServerClient'
import {ProcessType} from "shared/ProcessType"

const log = getLogger(__filename)

function getClient() {
	return require('shared/server/ServerClient').default as ServerClient
}

/**
 * Test the server entry, boot, etc
 */
describe('Server Entry',() => {
	let server:ServerEntry = null
	
	// Before the suite we load the server entry
	before( async () => {
		clearRequireCache()
		ProcessConfig.setType(ProcessType.Server)
		
		const {WorkerClient} = require('shared/WorkerEntry')
		WorkerClient.setNoKill(true)
		
		server = require('server/ServerEntry').default
		log.info('Starting to wait for server ready')
		await server.waitForStart()
		log.info('Server Started, testing begins')
	})
	
	after(async() => {
		await server.kill()
	})
	
	it('Server is running',async () => {
		ProcessConfig.setType(ProcessType.Main)
		const client = getClient()
		
		log.info(`Waiting for connection`)
		await client.connect()
		
		log.info(`Confirming connected`)
		expect(client.transport.connected).toBe(true)
	})
	
})
