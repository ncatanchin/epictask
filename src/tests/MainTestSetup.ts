import 'reflect-metadata'
import 'shared/PromiseConfig'
import 'shared/Globals'
import {Container} from 'typescript-ioc'
import {MainConfigurator} from 'main/MainConfigurator'
import * as nockGlobal from 'nock'

const log = getLogger(__filename)

process.on("unhandledRejection", function (reason, promise) {
	//deepTrace(reason)
	console.error('Unhandled rejection', reason)
	log.error('Unhandled rejection', reason, promise)

})


process.on("uncaughtException", function (err) {
	console.error('Unhandled exception', err)
	log.error('Unhandled exception', err)
})


let loadedServices = {}
let configurator:MainConfigurator = null



export async function shutdownMain() {
	if (!configurator) return

	log.info(`Shutting down services`)
	await configurator.stop()
	configurator = null
	log.info(`Shutdown completed`)
}

export async function configureMain(...serviceClazzes) {
	try {
		if (configurator)
			await shutdownMain()

		log.info(`Loading services: ${serviceClazzes.map(clazz => clazz.name).join(', ')}`)
		configurator = Container.get(MainConfigurator)

		log.info(`Initializing services`)
		await configurator.init(...serviceClazzes)

		log.info(`Starting services`)
		await configurator.start()
	} catch (err) {

		log.error('Failed to config',err)
		try {
			await shutdownMain()
		} catch (err2) {}

		throw err
	}
}


declare global {
	const nock:typeof nockGlobal
	
	const MainTestSetup: {
		configureMain: typeof configureMain,
		shutdownMain: typeof shutdownMain
	}
}

Object.assign(global,{
	nock:nockGlobal,
	MainTestSetup: {
		configureMain,
		shutdownMain
	}
})


