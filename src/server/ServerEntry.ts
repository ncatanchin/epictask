require('shared/NodeEntryInit')

// Set State Server
assign(global as any,{
	isStateServer: true
})

// Start it up
import Electron from 'electron'
import * as Server from './Server'


const log = getLogger(__filename)

Electron.app.on('ready',Server.start)

if (module.hot) {
	module.hot.accept(() => log.info('Hot reloaded'))
}