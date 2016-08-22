// Initialize
import 'shared/WorkerEntryInit'

// Logger
const log = getLogger(__filename)

// Start
import 'DatabaseServer'


if (module.hot) {
	module.hot.accept(() => log.info(`Hot reloading`,__filename))
}