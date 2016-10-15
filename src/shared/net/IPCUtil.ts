


export function makeIPCServerId(name:string) {
	return `${name}-${process.env.NODE_ENV}`
}
