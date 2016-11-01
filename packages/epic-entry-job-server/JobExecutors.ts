

const log = getLogger(__filename)



/**
 * Find & load all jobs in the current tree
 */
export function loadAllExecutors() {
	log.info(`Loading Job Types`)
	
	// const ctx =
	// 	require.context('epic-entry-job-server/executors/',true)
	//
	// Get the filenames
	
	const
		executors = require('./executors'),
	
		jobExecutorNames = Object
			.keys(executors)
			.filter(key => key.endsWith('Executor'))
	
	log.info('Loading job executors',jobExecutorNames)
	
	// jobExecutorNames.forEach(ctx)
	//
	// // If HMR then accept the ctx
	// if (module.hot)
	// 	hmrSetup(ctx)
}

if (module.hot)
	module.hot.accept(['./executors'],() => loadAllExecutors)

