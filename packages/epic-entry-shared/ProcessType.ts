/**
 * All possible process types in EpicTask
 */
export enum ProcessType {
	JobServer = 1,
	JobWorker,
	Main,
	DatabaseServer,
	UI,
	Test,
	Storybook
}

/**
 * All Process Types
 */
export const AllProcessTypes:ProcessType[] =
	Object.keys(ProcessType).filter(key => typeof key === 'number') as any

/**
 * String types
 */
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
	JobServer: getProcessTypeName(ProcessType.JobServer),
	JobWorker: getProcessTypeName(ProcessType.JobWorker),
	Main: getProcessTypeName(ProcessType.Main),
	DatabaseServer: getProcessTypeName(ProcessType.DatabaseServer),
	UI: getProcessTypeName(ProcessType.UI),
	Test: getProcessTypeName(ProcessType.Test)
}

// Map the numerical values to strings as well
Object
	.keys(ProcessType)
	.filter(key => typeof key !== 'string')
	.forEach(key => Names[key] = ProcessType[key])

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


/**
 * Global process names
 */
export const
	AppStoreServerName = "AppStoreServer",
	DatabaseServerName = ProcessNames.DatabaseServer


Object.assign(global as any,{
	AppStoreServerName,
	DatabaseServerName
})

export default ProcessType