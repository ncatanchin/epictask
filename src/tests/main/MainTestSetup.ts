import 'reflect-metadata'
import 'shared/PromiseConfig'
import 'shared/Globals'
import {Container} from 'typescript-ioc'
import {MainConfigurator} from 'main/MainConfigurator'

const log = getLogger(__filename)

let loadedServices = {}
let configurator:MainConfigurator = null

export async function shutdownMain() {
	if (!configurator) return

	log.info(`Shutting down services`)
	await configurator.stop()
	configurator = null
	log.info(`Shutdown completed`)
}

export async function  configureMain(...serviceClazzes) {
	try {
		if (configurator) await shutdownMain()


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



