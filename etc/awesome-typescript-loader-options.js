export default (opts) => {
	return Object.assign({
		"awesomeTypescriptLoaderOptions": {
			"useBabel":     true,
			"forkChecker":  true,
			"useCache":     true,
			"babelOptions": {
				"presets":    [
					"es2016-node5",
					"stage-0",
					"react",
					"async-to-bluebird"
				],
				"plugins":    [],
				"sourceMaps": "both"
			}
		}
	}, opts)
}