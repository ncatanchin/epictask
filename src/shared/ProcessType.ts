/**
 * All possible process types in EpicTask
 */
export enum ProcessType {
	Server = 1,
	JobServer,
	JobWorker,
	Main,
	DatabaseServer,
	UI,
	Test
}

export type TProcessType =
	'Server' | 'JobServer' | 'JobWorker' | 'Main' |
		'DatabaseServer' | 'UI' | 'Test'



/**
 * Get the name of a specific process type
 *
 * @param processType
 * @returns {any}
 */
export function getProcessTypeName(processType:ProcessType):TProcessType {
	return ProcessType[processType] as TProcessType
}


/**
 * All Process Name Mappings
 */
const Names = {
	Server: getProcessTypeName(ProcessType.Server),
	JobServer: getProcessTypeName(ProcessType.JobServer),
	JobWorker: getProcessTypeName(ProcessType.JobWorker),
	Main: getProcessTypeName(ProcessType.Main),
	DatabaseServer: getProcessTypeName(ProcessType.DatabaseServer),
	UI: getProcessTypeName(ProcessType.UI),
	Test: getProcessTypeName(ProcessType.Test)
}

/**
 * Proxy to process names that throws
 * an error for invalid types
 *
 * @type {typeof Names}
 */
export const ProcessNames = new Proxy({},{
	get(target,prop) {
		const val = Names[prop]
		if (!val)
			throw new Error(`Unknown process type: ${prop}`)

		return val
	}
}) as typeof Names

export default ProcessType