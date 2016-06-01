require('source-map-support').install()
require('shelljs/global')
require('../webpack/parts/stats')
const
	del = require('del'),
	gulp = require('gulp'),
	runSequence = require('run-sequence'),
	git = require('gulp-git'),
	ghRelease = require('gulp-github-release'),
	tsc = require('typescript'),
	babel = require('gulp-babel'),
	tsdoc = require('gulp-typedoc')



Object.assign(global,{
	tsc,
	babel,
	tsdoc,
	gulp,
	runSequence,
	del,
	git,
	ghRelease,
	Deferred: require('./deferred')
},require('./helpers'))

const
	semver = require('semver'),
	path = require('path'),
	_ = require('lodash'),
	processDir = path.resolve(__dirname,'../..'),
	env = process.env.NODE_ENV || 'development'


const RunMode = {
	DevServer: 'DevServer',
	Watch: 'Watch'
}

const TargetType = {
	ElectronMain: {
		target: 'electron-main',
		env: {
			development: {
				runMode: RunMode.Watch
			}
		}
	},
	ElectronRenderer: {
		target: 'electron-renderer',
		env: {
			development: {
				runMode: RunMode.DevServer
			}
		}
	}
}


//noinspection JSUnresolvedFunction
Object.assign(global,{
	_,
	log: console,
	env,
	isDev: env === 'development',
	processDir,
	baseDir:processDir,
	basePackageJson: readJSONFileSync(`${processDir}/package.json`),
	RunMode,
	TargetType,
	Deferred: require('./deferred'),
	assert: require('assert')
})



// Config for release and versioning
/**
 * Project configuration
 */
const projectConfigs = require('../projects')

//noinspection JSUnresolvedVariable
Object.assign(global,{
	nextMinorVersion: semver.inc(basePackageJson.version,'patch'),
	releaseFiles: [],
	releaseDir: `${process.cwd()}/target/releases`,
	projectConfigs
})
