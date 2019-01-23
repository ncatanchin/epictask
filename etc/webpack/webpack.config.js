const
  Path = require('path'),
  Webpack = require("webpack"),
  {DefinePlugin} = Webpack,
  rootPath = Path.resolve(__dirname, '..', '..'),
  modulePath = Path.resolve(rootPath, 'node_modules'),
  sourcePath = Path.resolve(rootPath, 'src'),
  nodeExternals = require('webpack-node-externals'),
  DefinedEnv = require('./webpack.env'),
  {isDev} = DefinedEnv



module.exports = (isMain) => {
  /**
   * Create externals array
   */
  function makeExternals() {
    const whitelist = isMain ? [] : [/webpack/,/react-hot/,/codemirror/,/highlight\.js/]
  	return nodeExternals({
			whitelist
		})//['fs', 'module']
  }

	const config = {
		devtool: "source-map",
		output: {
			devtoolModuleFilenameTemplate: "file://[absolute-resource-path]"
		},
		resolve: {
			alias: {
				assets: Path.resolve(rootPath, 'src', 'assets'),
				common: Path.resolve(rootPath, 'src', 'common'),
				main: Path.resolve(rootPath, 'src', 'main'),
				renderer: Path.resolve(rootPath, 'src', 'renderer'),
				test: Path.resolve(rootPath, 'src', 'test'),
				'react-dom': '@hot-loader/react-dom'
			},
			extensions: ['.webpack.js', '.web.js', '.js', '.ts', '.tsx']
		},
		// optimization: {
		//   splitChunks: {
		//     cacheGroups: {
		//       node_vendors: {
		//         test: /[\\/]node_modules[\\/].*(?!mapper-annotated-scene).*/,
		//         chunks: "all",
		//         priority: 1
		//       }
		//     }
		//   }
		// },
		plugins: [
			// ENV
			new DefinePlugin(DefinedEnv),
			new Webpack.NamedModulesPlugin()

		],
		/**
		 * Node Shims
		 */
		node: {
			__filename: true,
			global: true,
			process: true,

		},

		cache: true,

		module: {

			rules: [
				{
					test: /^\.(scss|css)$/,
					use: ['style-loader!css-loader!sass-loader']
				},
				{
					test: /\.(j|t)sx?$/,
					exclude: /node_modules/,
					use: {
						loader: "babel-loader",
						options: {
							cacheDirectory: true,
							babelrc: false,
							presets: [
								[
									"@babel/preset-env",
									{
										targets: {
											electron: "3.2.2"
										}
									} // or whatever your project requires
								],
								"@babel/preset-typescript",
								"@babel/preset-react"
							],
							plugins: [
								// plugin-proposal-decorators is only needed if you're using experimental decorators in TypeScript
								["@babel/plugin-proposal-decorators", {legacy: true}],
								["@babel/plugin-proposal-class-properties", {loose: true}],
								["@babel/plugin-syntax-dynamic-import"],
								// [
								// 	"@babel/plugin-transform-runtime",
								// 	{
								// 		corejs: false,
								// 		helpers: true,
								// 		regenerator: true,
								// 		useESModules: true
								// 	}
								// ],
								"react-hot-loader/babel"
							]
						}
					}
				},
				{
					test: /\.jsx?$/,
					include: /node_modules/,
					use: ['react-hot-loader/webpack'],
				},
        {
          test: /\.js$/,
          use: ["source-map-loader"],
          enforce: "pre"
        }
			]
		},
	}

  console.log(config.externals = makeExternals())
	// if (isMain) {
	// 	/**
	// 	 * Externals
	// 	 */
	// 	config.externals = makeExternals()
	//
	// } else {
	//
	// }
	return config
}

