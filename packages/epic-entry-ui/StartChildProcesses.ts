

import { Events } from "epic-global/Constants"
import { benchmark } from "epic-global/Benchmark"


const
	log = getLogger(__filename)

/**
 * Ensure the main process starts the DatabaseServer
 * and the job server
 */
export const childServicesBoot = benchmark('Child service boot', async () => {
	
	
	if (!require('electron').remote.getGlobal(Events.MainBooted)) {
		const
			{ ipcRenderer } = require('electron')
		
		ipcRenderer.send('epictask-start-children')
		
		log.debug(`Going to wait for epictask-children-ready`)
		
		const
			childrenDeferred = Promise.defer()
		
		ipcRenderer.on(Events.ChildrenReady, () => {
			log.debug(`Got notification from main - kids are ready`)
			childrenDeferred.resolve()
		})
		
		await childrenDeferred.promise
	}
})
