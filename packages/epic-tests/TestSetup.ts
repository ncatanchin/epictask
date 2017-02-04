import 'jest'
import * as Fs from 'fs'
import * as Path from 'path'

//jest.mock('epic-entry-shared/EventHub')
process.env.EPIC_TEST = true

Object.assign(global,{
	DEBUG: true,
	TEST: true,
	VERSION: "0.0.1",
	LOCAL_CONFIG: JSON.parse(Fs.readFileSync(Path.resolve(process.cwd(),'epictask-local.json'),'utf-8')),
	__webpack_require__: require,
	assert:require('assert'),
	React: require('react'),
	ReactDOM: require('react-dom'),
	Radium: require('radium'),
	$: require('jquery'),
	_: require('lodash')
	
})

jest.mock('electron')
jest.mock('epic-electron')

require('epic-entry-shared/ProcessConfig')
ProcessConfig.setType(ProcessType.Test)

// LOAD SHARED REPOSITORY
//noinspection JSPrimitiveTypeWrapperUsage
new Array(
	'PromiseConfig',
	'Env',
	'LogConfig',
	'Globals',
	'EventHub'
).forEach(mod => require(`epic-entry-shared/${mod}`))

require('epic-registry')

const
	Settings = require("epic-global/settings/Settings").Settings

Object.assign(global,{
	getSettings() {
		return new Settings()
	}
})

const
	{ProcessClientEntry} = require('epic-entry-shared/ProcessClientEntry')

// DISABLE AUTO LAUNCH
ProcessClientEntry.setAutoLaunch(false)

// DISABLE REMOTE DB CLIENT
Env.Config.RemoteDatabase = false