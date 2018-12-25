
async function init():Promise<void> {
	await (await import("./DatabaseInit")).init()
}

export default init()
