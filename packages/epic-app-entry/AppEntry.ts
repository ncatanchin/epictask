require('source-map-support').install()
require('babel-polyfill')
import 'reflect-metadata'

import 'shared/Env'
import { acceptHot } from "shared/util/HotUtils"
import 'shared/NamespaceConfig'
import ProcessType from 'shared/ProcessType'
import 'shared/ProcessConfig'
import 'shared/PromiseConfig'
import 'shared/LogConfig'
import "shared/Globals"

import * as TypeLogger from 'typelogger'

import 'shared/index'




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
		require("ui/UIEntry")
		
	}
	
	const Entries = {
		[ProcessType.Main]: () => require("main/MainEntry"),
		[ProcessType.DatabaseServer]: () => require("db/DatabaseServerEntry"),
		[ProcessType.JobServer]: () => require("JobServerEntry.ts"),
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