const
	loaderUtils = require("loader-utils"),
	fs          = require('fs'),
	path        = require("path")


module.exports = function(content) {
	const {resourcePath} = this
	
	// Mark plugin as cache-able
	this.cacheable()
	
	//console.log(`Proxy provider is checking`,resourcePath)
	let hotStuff = ""
	if (/@Provided/.test(content)) {
		//console.log(`Adding @Provided hot loading for ${resourcePath}`)
		hotStuff = `
			if (module.hot) {
				const hotLog = (...hotLogArgs:any[]) => {
					(console as any).log(...hotLogArgs)
					
				}
				
				module.hot.accept(() => hotLog('HMR Updating Provided',typeof __filename !== 'undefined' ? __filename : '${resourcePath}'))	
			}	
		`
	}
	return content + hotStuff
}