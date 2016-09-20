///<reference path="../typings/custom/index.d.ts"/>

require('source-map-support').install()
require('babel-polyfill')
import 'reflect-metadata'

import 'shared/NamespaceConfig'
import ProcessType from 'shared/ProcessType'
import 'shared/ProcessConfig'
import 'shared/PromiseConfig'
import 'shared/LogConfig'
import "shared/Globals"

import * as TypeLogger from 'typelogger'

const Entries = {
	[ProcessType.Main]: () => require("main/MainEntry"),
	[ProcessType.DatabaseServer]: () => require("db/DatabaseServerEntry"),
	[ProcessType.JobServer]: () => require("job/JobServerEntry"),
	[ProcessType.UI]: () => require("ui/UIEntry")
}

if (DEBUG) {
	Entries[ProcessType.Test] = () => require("tests/AppTestEntry")
}

const
	processType = (ProcessType[process.env.EPIC_ENTRY] || ProcessType.Main) as ProcessType,
	entryFn = Entries[processType]

if (!entryFn)
	throw new Error('No valid entry type found for ' + processType + '/' + ProcessType[processType])


ProcessConfig.setType(processType)
TypeLogger.setPrefixGlobal(`(${ProcessConfig.getTypeName()}Proc)`)

entryFn()


if (module.hot) {
	module.hot.accept()
}