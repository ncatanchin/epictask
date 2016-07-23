
export enum ToastMessageType {
	Debug = 1,
	Info,
	Error
}

export interface IToastMessageAction {
	label:string,
	execute:Function
}

export interface IToastMessage {
	id:string,
	createdAt:number,
	type:ToastMessageType,
	notify?:boolean,
	content:any,
	actions?:IToastMessageAction[]
}