export type StringMap<V> = { [key:string]:V }

export type StringOrNumber = string | number

export type Pair<T1, T2> = [T1, T2]

export type FunctionOrValue<T> = (() => T) | T | null

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export interface IDataSet<T> {
	data:Array<T>
	total:number
	ready:boolean
	loadedRange:Pair<number, number>
	loading:boolean
}

export function makeDataSet<T>(
	data:Array<T> = Array<T>(),
	total:number = data.length,
	loadedStart:number = 0,
	loadedEnd:number = total
):IDataSet<T> {
	return {
		data,
		total,
		ready: total > -1,
		loadedRange: [loadedStart, loadedEnd],
		loading: false
	}
}

export type PromiseResolver<T = any,TResult1 = T> = ((value: T) => TResult1 | PromiseLike<TResult1>)

export type DataType = "issues" | "repos" | "orgs" | "users"

export interface IDataSyncRecord {
	id: number
	type: DataType
	timestamp: number
}

export interface IDataSyncStatus {
	type: DataType
	records: {[id:number]:IDataSyncRecord}
}
