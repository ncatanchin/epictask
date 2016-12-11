


import { acceptHot, getHot, setDataOnHotDispose } from "epic-global"
import { DatabaseAdapter } from "epic-database-adapters"
/**
 * Adapter reference
 * @type {DatabaseAdapter}
 */
let adapterInstance = getHot(module,'adapterInstance',null)

setDataOnHotDispose(module,() => ({adapterInstance}))

/**
 * Load the load adapter
 *
 * @returns {any}
 */
function loadLocalAdapter() {
	const
		DatabaseLocalAdapter = require('./DatabaseLocalAdapter').DatabaseLocalAdapter
	
	return adapterInstance = new DatabaseLocalAdapter()
}

/**
 * Load remote adapter
 *
 * @returns {DatabaseRemoteAdapter}
 */
function loadRemoteAdapter() {
	const
		DatabaseRemoteAdapter = require('./DatabaseRemoteAdapter').DatabaseRemoteAdapter
	
	return adapterInstance = new DatabaseRemoteAdapter()
}

/**
 * Get the database adapter
 *
 * @returns {any}
 */
export function getDatabaseAdapter():DatabaseAdapter {
	if (adapterInstance)
		return adapterInstance
	
	return (!Env.Config.RemoteDatabase || ProcessConfig.isType(ProcessType.DatabaseServer) ?
		loadLocalAdapter() :
		loadRemoteAdapter())
}


acceptHot(module)
