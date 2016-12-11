
declare global {
	interface IDatabaseRequest {
		id:string
		store?:string
		fn:string
		args:any[]
	}
	
	interface IDatabaseResponse {
		requestId:string
		result:any
		error?:Error
	}
}
export * from "./DatabaseClient"
export * from "./DatabaseEvents"
export * from "./DatabaseUtil"
export * from "./Stores"
