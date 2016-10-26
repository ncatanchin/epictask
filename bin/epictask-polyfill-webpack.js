const
	log = (...args) => {
		console.log(...args)
	}

const
	Module = require('module'),
	baseRequire = Module.prototype.require,
	searchPaths = ["../","../dist/app/"],
	epicEnsure = function(deps,fn) {
		fn(require)
	}


function epicRequire(id) {
	//log(`Loading ${id}`)
	
	if (this && this.require && !this.require.ensure) {
		this.require.ensue = epicEnsure
	}
	
	let
		mod = null
	
	if (id.startsWith('assets')) {
		for (let searchPath of searchPaths) {
			try {
				return require.resolve(`${searchPath}${id}`)
			} catch (err) {
				//log(`Unable to find ${id}  in ${searchPath}`)
			}
		}
		
	} else if (id.startsWith('epic-')) {
		let
			origId = id,
			resolved = false
		
		for (let searchPath of searchPaths) {
			try {
				const
					newId = require.resolve(`${searchPath}${id}`)
				
				//log(`Resolved ${id} to ${newId}`)
				id = newId
				resolved = true
				
				break
			} catch (err) {
				//log(`Unable to find ${id}  in ${searchPath}`)
			}
		}
		
		if (!resolved) {
			log(`Failed to resolve ${id}`)
		}
	}
	
	
	try {
		mod = baseRequire.apply(this,[id])
	} catch (err) {
		// try {
		// 	mod = require(id)
		// } catch (err2) {
		// 	log(`Failed to load`,err)
		// 	throw err
		// }
		throw err
	}
	
	return mod
	//if (id.startsWith())
}


epicRequire.ensure = epicEnsure
require.ensure = epicEnsure
	
	
	Module.prototype.require = epicRequire


Object.assign(global,{
	__NO_WEBPACK__:true,
	__webpack_require__: require,
	__non_webpack_require__: require,
	polyfillRequire(r) {
		if (!r.ensure)
			r.ensure = (deps,fn) => fn(r)
	}
})