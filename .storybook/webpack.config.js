// you can use this file to add your custom webpack plugins, loaders and anything you like.
// This is just the basic way to add additional webpack configurations.
// For more information refer the docs: https://goo.gl/qPbSyX

// IMPORTANT
// When you add this file, we won't add the default configurations which is similar
// to "React Create App". This only has babel loader to load JavaScript.

module.exports = function (storybookBaseConfig, configType) {
	
	const
		projects = require('../etc/projects'),
		rendererProject = projects['electron-renderer-ui']
	
	const webpackConfig =
		rendererProject.webpackConfigFn(rendererProject)
	
	return _.merge({},webpackConfig,storybookBaseConfig)
	//
	// return {
	// 	plugins: [
	// 		// your custom plugins
	// 	],
	// 	module: {
	// 		loaders: [
	// 			// add your custom loaders.
	// 		],
	// 	}
	// }
};
