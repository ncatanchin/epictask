
async function init():Promise<void> {
	await (await import('./StorePersistWatcher'))
	await (await import('./ConfigWatcher'))
	await (await import('./DataWatcher'))
}

export default init()
