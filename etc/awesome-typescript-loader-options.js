module.exports = (opts) => {
	return Object.assign({
		"awesomeTypescriptLoaderOptions": {
			"useBabel":     true,
			"forkChecker":  true,
			"useCache":     true,
			"babelOptions": {
				"presets":    [
					// The following is still required because babel does not properly
					// recognize when spreads are being used inside of object
					// destructuring (ES7).
					//require("babel-plugin-transform-es2015-destructuring"),
					"es2016-node5",
					// "es2015-native-modules",
					"stage-0",
					"react",
					"async-to-bluebird"
				],
				"plugins":    [
					//'transform-es2015-modules-commonjs'
					//"add-module-exports",
					//"transform-runtime",
					//"transform-async-to-generator"
				],
				"sourceMaps": "both"
			}
		}
	}, opts)
}