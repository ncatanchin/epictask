require('shared/WorkerEntryInit')

// Set State Server
assign(global as any,{
	isStateServer: true
})

// Start it up
import './Server'


const log = getLogger(__filename)

if (module.hot) {
	module.hot.accept(() => log.info('Hot reloaded',__filename))
}