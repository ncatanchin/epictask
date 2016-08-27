import {ServerClient} from 'shared/server/ServerClient'
import {ProcessType} from "shared/ProcessType"
import {Map} from 'immutable'
import WorkerManager from 'shared/WorkerManager'
import storeBuilder from 'shared/store/AppStoreBuilder'
import {AppActionFactory} from "shared/actions/AppActionFactory"
import {AppStateType} from "shared/AppStateType"

const log = getLogger(__filename)

function getClient() {
	return require('shared/server/ServerClient').default as ServerClient
}

/**
 * Test the server entry, boot, etc
 */
describe('Server Entry',() => {
	//let server:ServerEntry = null
	
	// Before the suite we load the server entry
	before( async () => {
		log.info('Starting server worker')
		await WorkerManager.startAll(ProcessType.StateServer)
		
		log.info('Creating store')
		await storeBuilder()
		//const {WorkerClient} = require('shared/WorkerEntry')
		// server = require('server/ServerEntry').default
		// log.info('Starting to wait for server ready')
		// await server.waitForStart()
		// log.info('Server Started, testing begins')
	})
	
	after(async() => {
		const client = getClient()
		client.kill()
		
		await WorkerManager.stopAll()
	})
	
	it('Server is running',async () => {
		//ProcessConfig.setType(ProcessType.Main)
		const client = getClient()
		
		log.info(`Waiting for connection`)
		await client.connect()
		
		log.info(`Confirming connected`)
		expect(client.transport.connected).toBe(true)
	})
	
	it('Server Updates State',async () => {
		
		const client = getClient()
		
		log.info(`Waiting for connection`)
		await client.connect()
		
		log.info("Getting state")
		
		let state = null
		
		// One-liner to grab state
		const getState = async () => {
			// Brief delay to allow updates
			await Promise.delay(100)
			state = await client.getState()
		}
		
		await getState()
		expect(Map.isMap(state)).toBe(true)
		
		log.info('Setting not ready')
		const appActions:AppActionFactory = Container.get(AppActionFactory)
		appActions.setReady(false)
		await getState()
		expect(appActions.state.ready).toBe(false)
		
		appActions.setReady(true)
		await getState()
		expect(appActions.state.ready).toBe(true)
		
		
		appActions.setStateType(AppStateType.RepoAdd)
		await getState()
		expect(appActions.state.stateType).toBe(AppStateType.RepoAdd)
	})
	
})
