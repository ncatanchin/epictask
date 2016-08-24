// Initialize
import 'shared/WorkerEntryInit'

// Set process type
ProcessConfig.setType(ProcessConfig.Type.JobServer)

// Logger
const log = getLogger(__filename)


import './JobServer'


if (module.hot) {
	module.hot.accept(() => log.info(`Hot reloading`,__filename))
}

