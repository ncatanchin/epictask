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
	idProperty:keyof T
}

export function makeDataSet<T>(
	data:Array<T> = Array<T>(),
	total:number = data.length,
	loadedStart:number = 0,
	loadedEnd:number = total,
	idProperty:keyof T = "id" as any
):IDataSet<T> {
	return {
		data,
		total,
		ready: total > -1,
		loadedRange: [loadedStart, loadedEnd],
		loading: false,
		idProperty
	}
}

export function updateDataSet<T = any>(newData:Array<T>, oldDataSet:IDataSet<T> | null):IDataSet<T> {
	const	newDataSet = makeDataSet(newData)
	if (!oldDataSet)
		return newDataSet
	else if (_.isEqual(oldDataSet, newDataSet))
		return oldDataSet

	if (_.isEqual(newDataSet.data, oldDataSet.data)) {
		return Object.assign(newDataSet,{data: oldDataSet.data})
	}

  oldDataSet.data.forEach(oldObj => {
  	const
			oldId = oldObj[oldDataSet.idProperty],
			newObjIndex = newData.findIndex(newObj => newObj[newDataSet.idProperty] === oldId)

		if (newObjIndex > -1 && _.isEqual(newData[newObjIndex], oldObj)) {
			newDataSet.data[newObjIndex] = oldObj
		}
	})

	return newDataSet
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
