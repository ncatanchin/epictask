
const
	HtmlWebpackPlugin = require('html-webpack-plugin')

function makeConfig() {
	return {
		"packages": {
			
			// GLOBAL - NO DEPS
			// "epic-global": {
			// 	dependencies: []
			// },

			"epic-styles": {
				dependencies: ["epic-global"]
			},
			// "epic-models": {
			// 	dependencies: ["epic-global"]
			// },
			// "epic-command-manager": {
			// 	dependencies: ["epic-global"]
			// },
			// //
			// // GITHUB
			// "epic-github": {
			// 	dependencies: ["epic-models"]
			// },
			//
			// // NETWORKING
			// "epic-net": {
			// 	dependencies: ["epic-global"]
			// },
			//
			// // DATABASE CLIENT
			// "epic-database-client": {
			// 	dependencies: ["epic-models","epic-net"]
			// },
			//
			// // PROCESS MANAGER
			// "epic-process-manager": {
			// 	dependencies: ["epic-net"]
			// },
			// //
			// // TYPEDUX, STORE, STATE, ETC
			// "epic-typedux": {
			// 	dependencies: ["epic-command-manager","epic-process-manager","epic-github", "epic-database-client"]
			// },
			//
			// // SERVICES
			// "epic-services": {
			// 	dependencies: [
			// 		"epic-typedux"
			// 	]
			// },
			//
			// //SHARED ENTRY
			// "epic-entry-shared": {
			// 	dependencies: ["epic-services"]
			// },
			//
			// // // UI COMPONENTS
			// "epic-ui-components": {
			// 	dependencies: ["epic-typedux","epic-styles"]
			// },
			//
			// // // DEFAULT PLUGINS
			// "epic-plugins-default": {
			// 	dependencies: ["epic-ui-components"]
			// },
			//
			// //DATABASE SERVER
			// "epic-entry-database-server": {
			// 	dependencies: ["epic-models", "epic-database-client"],
			// 	entry: true
			// },
			// // //
			// // // // SHARED ENTRY
			// // "epic-entry-shared": {
			// // 	dependencies: [
			// // 		"epic-process-manager",
			// // 		"epic-services"
			// // 	]
			// // },
			// // //
			// // // // MAIN ENTRY
			// "epic-entry-main": {
			// 	dependencies: [
			// 		"epic-command-manager",
			// 		"epic-entry-shared"
			// 	],
			// 	entry: true,
			//
			// 	webpackConfig: (config,isDev) => {
			// 		config.plugins.push(
			// 			new HtmlWebpackPlugin({
			// 				filename: "app-entry.html",
			// 				template: `${process.cwd()}/packages/epic-assets/templates/AppEntry.jade`,
			// 				inject: false,
			// 				isDev
			// 			}),
			//
			// 			new HtmlWebpackPlugin({
			// 				filename: "splash-entry.html",
			// 				template: `${process.cwd()}/packages/epic-assets/templates/SplashEntry.jade`,
			// 				inject: false,
			// 				isDev
			// 			})
			// 		)
			//
			// 		return config
			// 	}
			// },
			// //
			// // // JOB SERVER ENTRY
			// "epic-entry-job-server": {
			// 	dependencies: ["epic-entry-shared"],
			// 	entry: true
			// },
			//
			//
			// //
			// // // UI ENTRY
			// "epic-entry-ui": {
			// 	dependencies: ["epic-plugins-default","epic-entry-shared"],
			// 	entry: true
			// },
			// //
			// // // BROWSER PRELOAD
			// "epic-entry-browser": {
			// 	dependencies: [],
			// 	entry: true
			// },
			// //
			//
			//
		}
	}
}


module.exports = makeConfig()
