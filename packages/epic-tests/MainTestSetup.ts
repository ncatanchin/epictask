import 'shared/NodeEntryInit'
import * as nockGlobal from 'nock'

const log = getLogger(__filename)

log.info('setting up test environment')

/**
 * Unhandled rejections
 */
process.on("unhandledRejection", function (reason, promise) {
	console.error('Unhandled rejection', reason)
	log.error('Unhandled rejection', reason, promise)

})

/**
 * Uncaught exceptions
 */
process.on("uncaughtException", function (err) {
	console.error('Unhandled exception', err)
	log.error('Unhandled exception', err)
})

// Configure ENV
ProcessConfig.setType(ProcessType.Test)
process.env.EPIC_TEST = 1




// export async function shutdownMain() {
// 	if (!configurator) return
//
// 	log.info(`Shutting down services`)
// 	await configurator.stop()
// 	configurator = null
// 	log.info(`Shutdown completed`)
// }
//
// export async function configureMain(...serviceClazzes) {
// 	try {
// 		if (configurator)
// 			await shutdownMain()
//
// 		log.info(`Loading services: ${serviceClazzes.map(clazz => clazz.name).join(', ')}`)
// 		configurator = Container.get(MainConfigurator)
//
// 		log.info(`Initializing services`)
// 		await configurator.init(...serviceClazzes)
//
// 		log.info(`Starting services`)
// 		await configurator.start()
// 	} catch (err) {
//
// 		log.error('Failed to config',err)
// 		try {
// 			await shutdownMain()
// 		} catch (err2) {}
//
// 		throw err
// 	}
// }

//
function clearRequireCacheGlobal(name = null) {
	const clearMod = (modId) => {
		delete require.cache[modId]
	}

	if (name) {
		try {
			const id = __non_webpack_require__.resolve(name)
			if (id) {
				clearMod(id)
				return
			}
		} catch (err) {
			log.warn('Unable to resolve',name,'going to clear all')
		}
	}
	
	Object.keys(require.cache).forEach(clearMod)
}

declare global {
	//noinspection JSUnusedLocalSymbols
	const nock:typeof nockGlobal
	
	//noinspection JSUnusedLocalSymbols
	const clearRequireCache:typeof clearRequireCacheGlobal
	
	//noinspection JSUnusedLocalSymbols
	// const MainTestSetup: {
	// 	configureMain: typeof configureMain,
	// 	shutdownMain: typeof shutdownMain
	// }
}

Object.assign(global,{
	nock:nockGlobal,
	clearRequireCache:clearRequireCacheGlobal
	// MainTestSetup: {
	// 	configureMain,
	// 	shutdownMain
	// }
})


