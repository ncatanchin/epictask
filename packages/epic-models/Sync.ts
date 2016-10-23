export interface ISyncDetails {
	error?:Error
	progress?:number
	message?:any
	time?:number
}

export enum SyncStatus {
	NotStarted = 1,
	InProgress,
	Completed,
	Failed
}