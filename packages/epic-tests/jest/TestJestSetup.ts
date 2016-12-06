import 'jest'

jest.mock('electron')
jest.mock('epic-electron')
jest.mock('node-uuid')
//jest.mock('epic-entry-shared/EventHub')


import 'epic-entry-shared/ProcessConfig'
ProcessConfig.setType(ProcessType.Test)

//jest.mock('typelogger')
import 'epic-entry-shared/PromiseConfig'



import 'epic-entry-shared/LogConfig'
import 'epic-entry-shared/Env'
import 'epic-entry-shared/Globals'
import { Settings } from "epic-global/settings/Settings"



assignGlobal({
	getSettings() {
		return new Settings()
	},
	assert:require('assert'),
	React: require('react'),
	ReactDOM: require('react-dom'),
	Radium: require('radium'),
	$: require('jquery')
})