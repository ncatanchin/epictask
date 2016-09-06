export default (opts) => {
	return Object.assign({
		"awesomeTypescriptLoaderOptions": {
			"useBabel":     true,
			"forkChecker":  true,
			"useCache":     true,
			"babelOptions": {
				"presets":    [
					"es6-node6",
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