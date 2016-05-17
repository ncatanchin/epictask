require('source-map-support').install()
require('shelljs/global')

const
	semver = require('semver'),
	helpers = require('./helpers'),
	{readJSONFileSync} = helpers,
	_ = require('lodash'),

	processDir = process.cwd(),
	env = process.env.NODE_ENV || 'development'

Object.assign(global,{
	_,
	log: console,
	env,
	isDev: env === 'development',
	processDir,
	baseDir:processDir,
	basePackageJson: readJSONFileSync(`${processDir}/package.json`)
},helpers)

// Config for release and versioning
Object.assign(global,{
	nextMinorVersion: semver.inc(basePackageJson.version,'patch'),
	releaseFiles: [],
	releaseDir: `${process.cwd()}/target/releases`
})
