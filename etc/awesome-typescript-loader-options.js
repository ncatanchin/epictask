module.exports = (opts) => {
	return Object.assign({
		"awesomeTypescriptLoaderOptions": {
			"useBabel":     true,
			"forkChecker":  true,
			"useCache":     true,
			"babelOptions": {
				"presets":    [
					"es2015-native-modules",
					"stage-0",
					"react"
				],
				"plugins":    [
					"add-module-exports",
					"transform-runtime",
					"transform-async-to-generator"
				],
				"sourceMaps": "both"
			}
		}
	}, opts)
}