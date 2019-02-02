
async function init():Promise<void> {
	await (require("./DatabaseInit")).init()
	await (require("./CommandManagerInit")).init()
}

export default init()
