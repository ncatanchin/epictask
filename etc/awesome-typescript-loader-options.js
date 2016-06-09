module.exports = (opts) => {
	return Object.assign({
		"awesomeTypescriptLoaderOptions": {

			"useBabel":     true,
			"forkChecker":  true,
			"useCache":     true,
			"babelOptions": {
				"presets":    [
					//"async-to-bluebird",
					"es2015-native-modules",
					//"es2015",
					"stage-0",
					"react"
				],
				"plugins":    [
					"add-module-exports",
					"transform-runtime"
				],
				"sourceMaps": "both"
				// "env": {
				// 	"development": {
				// 		"presets": ["react-hmre"]
				// 	}
				// }
			}
		}
	}, opts)
}