import ProcessType from 'shared/ProcessType'
import 'shared/ProcessConfig'
import 'shared/LogConfig'
import * as TypeLogger from 'typelogger'




const Entries = {
	[ProcessType.Main]: () => require("main/MainEntry"),
	[ProcessType.StateServer]: () => require("server/StateServerEntry"),
	[ProcessType.DatabaseServer]: () => require("db/DatabaseServerEntry"),
	[ProcessType.JobServer]: () => require("job/JobServerEntry")
}

if (DEBUG) {
	Entries[ProcessType.Test] = () => require("tests/AppTestEntry")
}

const processType = (ProcessType[process.env.EPIC_ENTRY] || ProcessType.Main) as ProcessType

const entryFn = Entries[processType]
if (!entryFn)
	throw new Error('No valid entry type found for ' + processType + '/' + ProcessType[processType])


ProcessConfig.setType(processType)
TypeLogger.setPrefixGlobal(`(${ProcessConfig.getTypeName()}Proc)`)

entryFn()
