require('shared/WorkerEntryInit')

// Set process type
ProcessConfig.setType(ProcessConfig.Type.Server)

// Start it up
import './Server'


const log = getLogger(__filename)

if (module.hot) {
	module.hot.accept(() => log.info('Hot reloaded',__filename))
}