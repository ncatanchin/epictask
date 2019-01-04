
async function init():Promise<void> {
	await (await import("./DatabaseInit")).init()
	await (await import("./CommandManagerInit")).init()
}

export default init()
