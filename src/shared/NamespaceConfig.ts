

declare global {
	const extendEpicTaskNS:(...srcs:any[]) => void
	namespace epictask {
		
	}
}

const
	g = global as any,
	_ = require('lodash')


// Define the base namespace
const ns = (g.epictask = g.epictask || {})

/**
 * Used to extend the epictask namespace
 *
 * @param sources
 */
function extendEpicTaskNS(...sources:any[]) {
	sources.forEach(src => {
		_.merge(ns,src || {})
	})
	
	return ns
}


Object.assign(g, {extendEpicTaskNS})

export {
	
}