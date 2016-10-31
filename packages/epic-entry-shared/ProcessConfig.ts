import ProcessTypeGlobal from './ProcessType'


export namespace ProcessConfigGlobal {
	
	/**
	 * Dev tool configs
	 */
	const ChildDevTools = {
		[ProcessTypeGlobal.DatabaseServer]: true,
		[ProcessTypeGlobal.JobServer]: false
	}
	
	/**
	 * All possible process types in EpicTask
	 */
	export const Type = ProcessTypeGlobal
	
	/**
	 * The current process type
	 *
	 * @type {ProcessType}
	 */
	let processType:ProcessTypeGlobal = null
	
	/**
	 * Check the current process type
	 *
	 * @param testProcessTypes
	 * @returns {boolean}
	 */
	export function isType(...testProcessTypes:ProcessTypeGlobal[]) {
		return testProcessTypes.includes(processType)
	}
	
	/**
	 * Set the global process type
	 *
	 * @param newProcessType
	 */
	export function setType(newProcessType:ProcessTypeGlobal) {
		processType = newProcessType
		console.log('Process Type set to',getTypeName())
	}
	
	/**
	 * Get this processes type
	 *
	 * @returns {ProcessTypeGlobal}
	 */
	export function getType() {
		return processType
	}
	
	/**
	 * Get process type name
	 *
	 * @returns {string}
	 */
	export function getTypeName(processType:ProcessTypeGlobal = getType()):string {
		return ProcessTypeGlobal[processType]
	}
	
	/**
	 * Is the main electron instance
	 * @returns {boolean}
	 */
	export function isMain() {
		return isType(ProcessTypeGlobal.Main)
	}
	
	
	/**
	 * Is the main UI process
	 * @returns {boolean}
	 */
	export function isUI() {
		return isType(ProcessTypeGlobal.UI)
	}
	
	
	/**
	 * Is the current process type storybook
	 * @returns {boolean}
	 */
	export function isStorybook() {
		return isType(ProcessTypeGlobal.Storybook)
	}
	
	/**
	 * Whether or not to show child dev tools
	 *
	 * @param processType
	 * @returns {any|boolean}
	 */
	export function showChildDevTools(processType:ProcessTypeGlobal) {
		return ChildDevTools[processType] && DEBUG
	}
	
}




declare global {
	
	
	let AppStoreServerName:string
	let DatabaseServerName:string
	
	//const ProcessType:typeof ProcessTypeGlobal
	
	namespace ProcessConfig {
		function isStorybook():boolean
		function showChildDevTools(processTypeIn:ProcessTypeGlobal)
		function isUIChildWindow():boolean
		function isUI():boolean
		function isMain():boolean
		function getTypeName(processTypeIn?:ProcessTypeGlobal):string
		function getType():ProcessTypeGlobal
		function setType(newProcessType:ProcessTypeGlobal)
		function isType(...testProcessTypes:ProcessTypeGlobal[])
		const Type:ProcessTypeGlobal
	}
	
	//noinspection JSUnusedLocalSymbols
	/**
	 * Process type of the currently running process
	 */
	//const ProcessConfig:typeof ProcessConfigGlobal
	
	//noinspection JSUnusedLocalSymbols
	const ProcessType:typeof ProcessTypeGlobal
}

// Assign to global
Object.assign(global as any,{
	ProcessConfig: ProcessConfigGlobal,
	ProcessType: ProcessConfigGlobal.Type
})