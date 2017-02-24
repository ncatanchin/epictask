import 'epic-tests/TestSetup'

import {DatabaseLocalAdapter} from '../DatabaseLocalAdapter'
import * as SampleStoreConfig from "./fixtures/SampleStoreConfig"
import {Sample,SampleStore} from "./fixtures/SampleStoreConfig"
import { getValue, isString } from "typeguard"

const
	log = getLogger(__filename)

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

let
	adapter:DatabaseLocalAdapter

/**
 * Reset the adapter
 *
 * @returns {Promise<void>}
 */
async function resetAdapter() {
	await stopAdapter()
	await startAdapter()
}

/**
 * Stop the adapter
 *
 * @returns {Promise<void>}
 */
async function stopAdapter() {
	if (!adapter)
		return
	
	try {
		await adapter.stop()
	} catch (err) {
		log.error(`Failed to stop adapter`,err)
	}
	
	adapter = null
}

/**
 * Start the adapter
 *
 * @returns {Promise<void>}
 */
async function startAdapter() {
	
	if (adapter)
		return
	
	
	adapter = new DatabaseLocalAdapter()
	await adapter.start()
}

/**
 * Close context
 *
 * @param context
 * @returns {Promise<void>}
 */
async function closeContext(context:IPluginStoreContext) {
	if (!getValue(() => context.internal.coordinator))
		return
	
	try {
		await adapter.closePluginDataContext(context)
	} catch (err) {
		log.error(`Failed to close context`,err)
	}
}

beforeEach(resetAdapter)
afterEach(stopAdapter)

test(`#local adapter can start`,async () => {
	expect(adapter.isRunning()).toBeTruthy()
})

test(`#local adapter can create plugin context`, async () => {
	let
		context:IPluginStoreContext = null
	
	try {
		context = await adapter.createPluginDataContext('sample-plugin',SampleStoreConfig)
		expect(context).toBeDefined()
		
		console.log(`Data store keys: ${Object.keys(context.stores)}`)
		
		let
			sampleStore = (context.stores as any).sample as SampleStore,
			sample1 = new Sample({value1: "1value"}),
			sample1Persisted = await sampleStore.save(sample1),
			doc = (sample1Persisted as any).$$doc
		
		console.log(`Rev = ${getValue(() => JSON.stringify(doc,null,4))}`)
		expect(getValue(() => isString(doc._rev))).toBeTruthy()
		
	} catch (err) {
		log.error(`Failed to start context`,err)
		expect(err).toBeNull()
	} finally {
		closeContext(context)
	}
})