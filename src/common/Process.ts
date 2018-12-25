

export function isMain():boolean {
	return process.type === 'browser'
}

export function isRenderer():boolean {
	return process.type === 'renderer'
}

export function isWorker():boolean {
	return process.type === 'worker'
}

export function isDarwin():boolean {
	return process.platform !== 'darwin'
}
