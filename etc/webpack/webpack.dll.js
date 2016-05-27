const
	webpack = require('webpack'),
	path = require('path'),
	fs = require('fs')

const
	baseDir = path.resolve(__dirname, '../..'),
	distDir = `${baseDir}/dist`,
	srcDir = `${baseDir}/src`,
	manifestPath = `${distDir}/dll-manifest.json`

// REGULAR MODE - STUDIO/etc - BUILD THE REF PLUGIN
let manifest = null;

if (fs.existsSync(manifestPath))
	manifest = require(manifestPath);


const manifestName = `[name]_[hash]`;

module.exports = {
	Name: 'DLLEntry',
	OutputName: manifestName,
	DllReferencePlugin: new webpack.DllReferencePlugin({
		manifest: manifest,
		context: baseDir,
		name: (manifest) ? manifest.name : null
	}),
	DllPlugin: new webpack.DllPlugin({
		path: manifestPath,
		name: manifestName
	}),
	OutputPath: `${distDir}/${manifestName}.js`,
	Libs: [
		"cryptr",
		"dataurl",
		//"babel-runtime",
		"github-api",
		"github-extended",
		"history",
		"reflect-metadata",
		"immutable",
		"lodash",
		"material-ui",
		"flexbox-react",
		"react",
		"react-addons-css-transition-group",
		"react-dom",
		"react-redux",
		"react-router",
		"react-router-redux",
		"react-css-modules",
		"react-tap-event-plugin",
		"redux",
		"redux-logger",
		"redux-thunk",
		//"react-dock",


		// TODO: exclude from prod build
		//"redux-devtools-log-monitor",
		//"redux-devtools",

	]
}