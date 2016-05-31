
const wpRequire = require('enhanced-require')(module, {
	// options
	recursive: true // enable for all modules recursively
	// This replaces the original require function in loaded modules
})


wpRequire('../dist/MainEntry')