import {isMain, isRenderer} from "common/Process"

async function init():Promise<void> {
	await (await import('./StorePersistWatcher')).default
	await (await import('./ConfigWatcher')).default
	
	if (isRenderer()) {
		await (await import('./DataWatcher')).default
	}
}

export default init()
