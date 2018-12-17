const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const KotlinWebpackPlugin = require('@jetbrains/kotlin-webpack-plugin')
const getClientEnvironment = require('./env')

const Path = require("path")

// Webpack uses `publicPath` to determine where the app is being served from.
// In development, we always serve from the root. This makes config easier.
const publicPath = '/'
// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_PATH%/xyz looks better than %PUBLIC_PATH%xyz.
const publicUrl = ''
// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl)


const kotlinModuleName = 'epictask'


module.exports = (isMain) => {
	const Paths = require('./paths')(isMain)
	return {
		devtool: 'cheap-module-source-map',
		// These are the "entry points" to our application.
		// This means they will be the "root" imports that are included in JS bundle.
		// The first two entry points enable "hot" CSS and auto-refreshes for JS.
		
		output: {
			devtoolModuleFilenameTemplate: info =>
				Path.resolve(info.absoluteResourcePath)
		},
		
		resolve: {
			modules: [
				'node_modules',
				Paths.appNodeModules,
				Paths.kotlinOutputPath,
			].concat(
				// It is guaranteed to exist because we tweak it in `env.js`
				process.env.NODE_PATH.split(Path.delimiter).filter(Boolean)
			),
			
			alias: {
				src: Paths.appSrc
			}
		},
		
		module: {
			strictExportPresence: true,
			rules: [
				{
					test: /\.js$/,
					include: Paths.kotlinOutputPath,
					loader: require.resolve('source-map-loader'),
					enforce: 'pre',
				},
			]
		},
		
		plugins: [
			new KotlinWebpackPlugin({
				src: [Paths.appSrc,Paths.typesSrc],
				output: Paths.kotlinOutputPath,
				moduleName: "index",
				librariesAutoLookup: true,
				packagesContents: [
					require(Paths.appPackageJson),
				],
			}),
		],
		
		node: {
			__dirname: true,
			__filename: true
		}
	}
}