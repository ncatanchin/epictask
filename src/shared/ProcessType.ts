/**
 * All possible process types in EpicTask
 */
export enum ProcessType {
	Server,
	JobServer,
	JobWorker,
	Main,
	DatabaseServer,
	UI
}

export default ProcessType