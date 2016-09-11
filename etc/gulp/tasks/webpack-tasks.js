require ('./../../webpack/parts/stats.js')
const
	path = require('path'),
	fs = require('fs'),
	gutil = require('gulp-util'),
	babel = require('gulp-babel'),
	webpack = require('webpack'),
	express = require('express'),
	{baseDir,chalk} = global



/**
 * Run all compile tasks sequentially
 */
function makeWebpackCompile(watch = false) {
	return function(done) {
		const
			webpackConfig = require(`${baseDir}/etc/webpack/webpack.config`),
			compiler = webpack(webpackConfig)
		
		if (process.env.DASHBOARD) {
			const DashboardPlugin = require('webpack-dashboard/plugin')
			
			compiler.apply(new DashboardPlugin({
				port: 4001
			}))
		}
		
		function doCallback(err,stats) {
			if (err) {
				log.error('an error occurred', err)
				const {errors, warnings} = stats.toJson()
				if (errors) {
					errors.forEach(log.error.bind(log))
				}
				if (warnings) {
					warnings.forEach(log.warn.bind(log))
				}
			} else {
				log.info(`[webpack] Completed / watching(${watch})`, (stats) ? stats.toString(WebpackStatsConfig) : null, err)
				
			}
			
			if (webpackConfig.onCompileCallback)
				webpackConfig.onCompileCallback(err,stats,watch)
			
			if (!watch) {
				//noinspection JSCheckFunctionSignatures
				done(err)
			}
		}
		
		if (watch) {
			compiler.watch({},doCallback)
		} else {
			// Execute single build
			compiler.run(doCallback)
		}
	}
}

const
	compileTask = makeWebpackCompile(false),
	compileWatchTask = makeWebpackCompile(true)

gulp.task('compile-watch',[],compileWatchTask)
gulp.task('compile',[],compileTask)
gulp.task('clean-compile-watch',['clean','compile-watch'])
