import ProcessType from 'shared/ProcessType'

const Entries = {
	[ProcessType.Main]: () => require("main/MainEntry"),
	[ProcessType.Server]: () => require("server/ServerEntry"),
	[ProcessType.DatabaseServer]: () => require("db/DatabaseServerEntry"),
	[ProcessType.JobServer]: () => require("job/JobServerEntry")
}

if (DEBUG) {
	Entries[ProcessType.Test] = () => require("tests/AppTestEntry")
}

const entryType = ProcessType[process.env.EPIC_ENTRY] || ProcessType.Main

const entryFn = Entries[entryType]
if (!entryFn)
	throw new Error('No valid entry type found for ' + ProcessType[entryType])

entryFn()
