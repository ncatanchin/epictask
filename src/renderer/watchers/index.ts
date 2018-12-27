
async function init():Promise<void> {
	await (await import('./StorePersistWatcher')).default
	await (await import('./ConfigWatcher')).default
	await (await import('./DataWatcher')).default
}

export default init()
