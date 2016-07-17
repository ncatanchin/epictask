

export interface IDatabaseRequest {
	id:string
	store?:string
	fn:string
	args:any[]
}

export interface IDatabaseResponse {
	requestId:string
	result:any
	error?:Error
}