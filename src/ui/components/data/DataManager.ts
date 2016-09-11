

import {Stores} from "shared/Stores"
const log = getLogger(__filename)


export type TMappedProps = {[mappedPropName:string]:any}

/**
 * Custom mapping provider
 */
export type TDataMappedProvider = (props) => Promise<TMappedProps>

/**
 * Custom provider request shape
 */
export interface IDataProviderRequest {
	props:{[name:string]:any}
	provider:TDataMappedProvider
}

/**
 * Custom Provider Pending Request
 */
export interface IDataProviderPendingRequest extends IDataProviderRequest {
	promise:Promise<any[]>
}

export type TDataIdBase = string

/**
 * A function that returns an array or individual id
 */
export type TDataIdFn<P> = (props:P) => TDataIdBase

/**
 * Prevailing type of the id/ids value you can pass in
 */
export type TDataId<P> = TDataIdFn<P>|TDataIdBase




export interface IDataRequest {
	ids:any[]
	type:any
}

export interface IDataPendingRequest extends IDataRequest {
	promise:Promise<any[]>
}

export interface IDataBackend {
	get(type:any,ids:any[]):Promise<any[]>
}

let dataBackend:IDataBackend = {
	get(type:any,ids:any[]):Promise<any> {
		const store = Container.get(Stores).getModelStore(type)
		if (!ids[0]) {
			log.warn(`First id must be truthy`,ids)
			return Promise.resolve([])
		}
		return store.bulkGet(...ids)
	}
}

const overrideTypeDataBackends = {} as any

/**
 * Override the default backend for a specific type
 *
 * @param type
 * @param typeBackend
 */
export function overrideDataTypeBackend<T>(type:{new():T},typeBackend:(...ids:any[]) => Promise<T[]>) {
	overrideTypeDataBackends[type.$$clazz || type.name] = typeBackend
}


export class DataClient {
	
	private _killed
	
	get killed() {
		return this._killed
	}
	
	request({type,ids}:IDataRequest):Promise<any[]> {
		if (this.killed)
			return Promise.reject(new Error(`Data client killed`))
		
		return new Promise<any[]>(async (resolve,reject) => {
			try {
				
				const typeName = type.$$clazz || type.name
				resolve(overrideTypeDataBackends[typeName] ?
					overrideTypeDataBackends[typeName](...ids) :
					dataBackend.get(type,ids))
			} catch (err) {
				log.error(`Data backend failed to get data`, err)
				reject(err)
			}
		})
	}
	
	kill() {
		this._killed = true
	}
}






export function createDataClient() {
	return new DataClient()
}