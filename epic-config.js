
const
	HtmlWebpackPlugin = require('html-webpack-plugin')

function makeConfig() {
	return {
		"packages": {
			
			// GLOBAL - NO DEPS
			"epic-global": {
				dependencies: []
			},
			
			// COMMON, STYLES, MODELS
			"epic-common": {
				dependencies: ["epic-global"]
			},
			"epic-styles": {
				dependencies: ["epic-common"]
			},
			"epic-models": {
				dependencies: ["epic-common"]
			},
			//
			// GITHUB
			"epic-github": {
				dependencies: ["epic-common"]
			},

			// NETWORKING
			"epic-net": {
				dependencies: ["epic-common"]
			},

			// DATABASE CLIENT
			"epic-database-client": {
				dependencies: ["epic-models","epic-net"]
			},
			// PROCESS MANAGER
			"epic-process-manager": {
				dependencies: ["epic-common","epic-net"]
			},
			//
			// TYPEDUX, STORE, STATE, ETC
			"epic-typedux": {
				dependencies: ["epic-process-manager","epic-github", "epic-database-client"]
			},

			// SERVICES
			"epic-services": {
				dependencies: [
					"epic-typedux",
					"epic-database-client"
				]
			},
			//
			
			//
			//
			//
			//DATABASE SERVER
			"epic-entry-database-server": {
				dependencies: ["epic-models", "epic-database-client"],
				entry: true
			},
			// //
			// // // SHARED ENTRY
			// "epic-entry-shared": {
			// 	dependencies: [
			// 		"epic-process-manager",
			// 		"epic-services"
			// 	]
			// },
			// //
			// // // MAIN ENTRY
			"epic-entry-main": {
				dependencies: [
					"epic-process-manager",
					"epic-services"
				],
				entry: true,

				webpackConfig: (config,isDev) => {
					config.plugins.push(
						new HtmlWebpackPlugin({
							filename: "app-entry.html",
							template: `${process.cwd()}/packages/epic-assets/templates/AppEntry.jade`,
							inject: false,
							isDev
						}),

						new HtmlWebpackPlugin({
							filename: "splash-entry.html",
							template: `${process.cwd()}/packages/epic-assets/templates/SplashEntry.jade`,
							inject: false,
							isDev
						})
					)

					return config
				}
			},
			//
			// // JOB SERVER ENTRY
			"epic-entry-job-server": {
				dependencies: ["epic-services"],
				entry: true
			},

			// // UI COMPONENTS
			"epic-ui-components": {
				dependencies: ["epic-typedux","epic-styles"]
			},
			//
			// // UI ENTRY
			"epic-entry-ui": {
				dependencies: ["epic-ui-components","epic-plugins-default", "epic-services"],
				entry: true
			},
			//
			// // BROWSER PRELOAD
			"epic-entry-browser": {
				dependencies: [],
				entry: true
			},
			//
			// // DEFAULT PLUGINS
			"epic-plugins-default": {
				dependencies: ["epic-ui-components"]
			}
			
		}
	}
}


module.exports = makeConfig()
