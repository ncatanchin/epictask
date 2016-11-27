import 'jest'

//jest.mock('electron')
//jest.mock('epic-electron')
jest.mock('node-uuid')
//jest.mock('epic-entry-shared/EventHub')

//jest.mock('typelogger')
import 'epic-entry-shared/ProcessConfig'
ProcessConfig.setType(ProcessType.Test)



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