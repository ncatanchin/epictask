export type StringMap<V> = { [key:string]:V }


export type Pair<T1, T2> = [T1, T2]

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

