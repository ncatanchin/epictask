module.exports = {
	"awesomeTypescriptLoaderOptions": {

		"instanceName": "electron-main",
		"useBabel": true,
		"forkChecker": true,
		"useCache": true,
		"babelOptions": {
			"presets": [
				//"async-to-bluebird",
				"es2015-native-modules",
				//"es2015",
				"stage-0",
				"react"
			],
			"plugins": [
				"add-module-exports",
				"transform-runtime"
				// ["module-alias", [
				// 	{ "src": `${baseDir}/src/epictask`, "expose": "epictask" },
				// 	// { "src": "./src/components", "expose": "awesome/components" },
				// 	// { "src": "npm:lodash", "expose": "underscore" }
				// ]]
			],
			//"plugins": ["add-module-exports","transform-runtime"],
			//"plugins": ["add-module-exports"],
			// "plugins": [
			// 	["babel-plugin-inject-banner",{
			// 		"bannerCode": "const log = require('typelogger').create(__filename)"
			// 	}],"add-module-exports"],
			"sourceMaps": "both",
			// "env": {
			// 	"development": {
			// 		"presets": ["react-hmre"]
			// 	}
			// }
		}
	}
}