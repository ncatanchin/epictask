module.exports = (opts) => {
	return Object.assign({
		"awesomeTypescriptLoaderOptions": {
			"useBabel":     true,
			"forkChecker":  true,
			"useCache":     true,
			"babelOptions": {
				"presets":    [
					//"es2015-native-modules",
					"modern/webpack2",
					"stage-0",
					"react",
					"async-to-bluebird"
				],
				"plugins":    [
					//"add-module-exports",
					"transform-runtime",
					//"transform-async-to-generator"
				],
				"sourceMaps": "both"
			}
		}
	}, opts)
}