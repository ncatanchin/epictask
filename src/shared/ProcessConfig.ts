import ProcessType from './ProcessType'



export namespace ProcessConfigGlobal {
	
	/**
	 * Dev tool configs
	 */
	const ChildDevTools = {
		[ProcessType.DatabaseServer]: false,
		[ProcessType.JobServer]: false
	}
	
	/**
	 * All possible process types in EpicTask
	 */
	export const Type = ProcessType
	
	/**
	 * The current process type
	 *
	 * @type {ProcessType}
	 */
	let processType:ProcessType = null
	
	/**
	 * Check the current process type
	 *
	 * @param testProcessTypes
	 * @returns {boolean}
	 */
	export function isType(...testProcessTypes:ProcessType[]) {
		return testProcessTypes.includes(processType)
	}
	
	/**
	 * Set the global process type
	 *
	 * @param newProcessType
	 */
	export function setType(newProcessType:ProcessType) {
		processType = newProcessType
		console.log('Process Type set to',getTypeName())
	}
	
	/**
	 * Get this processes type
	 *
	 * @returns {ProcessType}
	 */
	export function getType() {
		return processType
	}
	
	/**
	 * Get process type name
	 *
	 * @returns {string}
	 */
	export function getTypeName(processType:ProcessType = getType()):string {
		return ProcessType[processType]
	}
	
	/**
	 * Is the main electron instance
	 * @returns {boolean}
	 */
	export function isMain() {
		return isType(ProcessType.Main)
	}
	
	
	/**
	 * Is the main UI process
	 * @returns {boolean}
	 */
	export function isUI() {
		return isType(ProcessType.UI)
	}
	
	/**
	 * Is a UI dialog
	 *
	 * @returns {boolean}
	 */
	export function isUIChildWindow() {
		return isType(ProcessType.UIChildWindow)
	}
	
	/**
	 * Is the current process type storybook
	 * @returns {boolean}
	 */
	export function isStorybook() {
		return isType(ProcessType.Storybook)
	}
	
	/**
	 * Whether or not to show child dev tools
	 *
	 * @param processType
	 * @returns {any|boolean}
	 */
	export function showChildDevTools(processType:ProcessType) {
		return ChildDevTools[processType] && DEBUG
	}
	
}




declare global {
	
	//noinspection JSUnusedLocalSymbols
	/**
	 * Process type of the currently running process
	 */
	const ProcessConfig:typeof ProcessConfigGlobal
	
	//noinspection JSUnusedLocalSymbols
	const ProcessType:typeof ProcessConfigGlobal.Type
}

// Assign to global
Object.assign(global as any,{
	ProcessConfig: ProcessConfigGlobal,
	ProcessType: ProcessConfigGlobal.Type
})