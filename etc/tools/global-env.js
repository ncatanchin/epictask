require('source-map-support').install()
require('shelljs/global')
require('../webpack/parts/stats')

const
	del         = require('del'),
	gulp        = require('gulp'),
	runSequence = require('run-sequence'),
	git         = require('gulp-git'),
	ghRelease   = require('gulp-github-release'),
	tsc         = require('typescript'),
	babel       = require('gulp-babel')


Object.assign(global, {
	tsc,
	babel,
	gulp,
	runSequence,
	del,
	git,
	ghRelease,
	Deferred: require('./deferred')
}, require('./helpers'))

process.argv.forEach(arg => {
	if (arg === '--dev')
		process.env.NODE_ENV = 'development'
})

/**
 * Global modules and
 * @type {SemVer}
 */
const semver     = require('semver')
const path       = require('path')
const _          = require('lodash')
const processDir = path.resolve(__dirname, '../..')
const RamDiskPath = path.join(process.env.HOME,'DevelopmentRAM','epictask')
const env        = process.env.NODE_ENV || 'development'

console.log('env = ',env)
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
Object.assign(global, {
	_,
	log: console,
	env,
	isDev: env === 'development',
	processDir,
	baseDir: processDir,
	basePackageJson: readJSONFileSync(`${processDir}/package.json`),
	RunMode,
	RamDiskPath,
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
Object.assign(global, {
	nextMinorVersion: semver.inc(basePackageJson.version, 'patch'),
	releaseFiles: [],
	releaseDir: `${process.cwd()}/target/releases`,
	projectConfigs
})
