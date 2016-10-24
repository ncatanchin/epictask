require('source-map-support').install()
require('babel-polyfill')
import 'reflect-metadata'

import 'epic-global'

import {ProcessType} from 'epic-global'

import * as TypeLogger from 'typelogger'



import { acceptHot } from  "epic-common"


// const Entries = {
// 	[ProcessType.Main]: () => require("main/MainEntry"),
// 	[ProcessType.DatabaseServer]: () => require("db/DatabaseServerEntry"),
// 	[ProcessType.JobServer]: () => require("job/JobServerEntry"),
// 	[ProcessType.UI]: () => require("ui/UIEntry"),
// 	[ProcessType.UIChildWindow]: () => require("ui/UIEntry")
// }

// if (DEBUG) {
// 	Entries[ProcessType.Test] = () => require("tests/AppTestEntry")
// }

function loadApp() {
	
	function loadUI() {
		require("epic-entry-ui")
		
	}
	
	const Entries = {
		[ProcessType.Main]: () => require("epic-entry-main"),
		[ProcessType.DatabaseServer]: () => require("epic-entry-database-server"),
		[ProcessType.JobServer]: () => require("epic-entry-job-server"),
		[ProcessType.UI]: loadUI,
		[ProcessType.UIChildWindow]: loadUI
	}
	
	const
		processType = (ProcessType[ process.env.EPIC_ENTRY ] || ProcessType.Main) as ProcessType,
		entryFn = Entries[ processType ]
	
	if (!entryFn)
		throw new Error('No valid entry type found for ' + processType + '/' + ProcessType[ processType ])
	
	
	ProcessConfig.setType(processType)
	TypeLogger.setPrefixGlobal(`(${ProcessConfig.getTypeName()}Proc)`)
	
	entryFn()
	
}

if (process.type === 'browser' && !process.env.EPIC_ENTRY) {
	// IF CLEAN REQUESTED
	require.ensure(['main/Cleaner'],function() {
		require('main/Cleaner')
		loadApp()
	})
} else {
	loadApp()
}

acceptHot(module,console)