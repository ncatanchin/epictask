import { benchmark } from "epic-global/Benchmark"
import { WindowType, IWindowConfig } from "epic-process-manager-client/WindowManagerClient"
import { ProcessNames,ProcessType } from "epic-entry-shared"
import { getWindowManager } from "epic-process-manager"


const
	log = getLogger(__filename),
	backgroundWindowOpts = {
		type: WindowType.BackgroundWorker,
		singleWindow: true,
		autoRestart: true,
		showDevTools: true,
		storeState: true
	},
	
	backgroundProcessConfigs:IWindowConfig[] = [
		
		Object.assign({
			name: ProcessNames.DatabaseServer,
			processType: ProcessType.DatabaseServer,
		},backgroundWindowOpts),
		
		Object.assign({
			name: ProcessNames.JobServer,
			processType: ProcessType.JobServer,
		},backgroundWindowOpts)
	]

/**
 * Ensure the main process starts the DatabaseServer
 * and the job server
 */
export const startBackgroundProcesses = benchmark('Background process boot', async () => {
	
	const
		windowManager = getWindowManager()
	
	await Promise.all(backgroundProcessConfigs.map(config => windowManager.open(config)))
	
	log.info(`All child processes have booted`)
		
	
})
