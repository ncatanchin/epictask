import ProcessType from 'shared/ProcessType'
import 'shared/ProcessConfig'

const Entries = {
	[ProcessType.Main]: () => require("main/MainEntry"),
	[ProcessType.Server]: () => require("server/ServerEntry"),
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

entryFn()
