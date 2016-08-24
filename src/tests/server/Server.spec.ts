import * as ServerType from 'server/Server'
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
	let server:typeof ServerType = null
	
	// Before the suite we load the server entry
	before( async () => {
		require('server/ServerEntry')
		server = require('server/Server')
		
		await server.start()
	})
	
	after(async() => {
		await server.stop()
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
