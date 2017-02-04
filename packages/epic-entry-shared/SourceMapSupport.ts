/**
 * Install source map support with a custom handler
 * for NON absolute paths
 */
require('source-map-support').install({
	retrieveSourceMap(source) {
		if (/^(\/|\.|http|file)/.test(source)) {
			return null
		}
		
		return {
			map: {
				version: 3,
				file: "null.js.map",
				sources: [],
				sourceRoot: "/",
				names: [],
				mappings: ""
			}
		}
	}
})

export {}
