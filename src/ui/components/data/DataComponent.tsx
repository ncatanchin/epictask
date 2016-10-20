// Imports
import * as React from 'react'
import {
	DataClient, createDataClient, TDataId, IDataRequest, IDataPendingRequest,
	TDataMappedProvider, IDataProviderPendingRequest, IDataProviderRequest
} from "ui/components/data/DataManager"
import {isFunction, isString} from "shared/util"
import './DataProviders'
import { PureRender } from "ui/components/common/PureRender"


// Constants
const log = getLogger(__filename)

export type TDataComponentFactory<T extends any> = (target:{new():T}) => typeof target
export type TDataComponent<P extends any> = React.Component<P,any>
export type TDataProviderPropertyMapper = (props) => string[]

export type TDataConfigType<P> = IDataComponentMapping<P>|IDataProviderMapping


export interface IDataComponentMapping<P> {
	idProperty:TDataId<P>
	type:any
	modelIdProperty:string
	mappedProperty:string
	mappedErrorProperty?:string
	defaultValue?:any
}

export interface IDataProviderMapping extends IDataComponentMapping<any> {
	inputProperties:string[]|string|TDataProviderPropertyMapper
	provider:TDataMappedProvider
}

/**
 * Type guard for provider vs regular mapping
 * @param o
 * @returns {string[]|TDataProviderPropertyMapper|string|boolean}
 */
function isProviderMapping(o):o is IDataProviderMapping {
	return o.inputProperties && isFunction(o.provider)
}



/**
 * Create data mapping for standard provider
 *
 * @param type
 * @param idProperty
 * @param modelIdProperty
 * @param mappedProperty
 * @param defaultValue
 * @param mappedErrorProperty
 * @returns {{type: any, idProperty: TDataId<any>, modelIdProperty: string, mappedProperty: string, mappedErrorProperty: null, defaultValue: any}}
 * @constructor
 */
export function MapData(type:any,idProperty:TDataId<any>,modelIdProperty:string,mappedProperty:string,defaultValue,mappedErrorProperty = null):IDataComponentMapping<any> {
	return {
		type,
		idProperty,
		modelIdProperty,
		mappedProperty,
		mappedErrorProperty,
		defaultValue
	}
}



/**
 * Create a data mapping provider config
 *
 * @param inputProperties
 * @param provider
 * @returns {IDataProviderMapping}
 * @constructor
 */
export function MapProvider(
	inputProperties:string[]|TDataProviderPropertyMapper,
	provider:TDataMappedProvider)
/**
 * Extra params for type and id caching
 *
 * @param inputProperties
 * @param provider
 * @param type
 * @param modelIdProperty
 * @param defaultValue
 * @returns {IDataProviderMapping}
 * @constructor
 */
export function MapProvider(
	inputProperties:string[]|TDataProviderPropertyMapper,
	provider:TDataMappedProvider,
	type:any,
	modelIdProperty:string,
  defaultValue?:any
)
export function MapProvider(
	inputProperties:string[]|TDataProviderPropertyMapper,
	provider:TDataMappedProvider,
  type:any = null,
  modelIdProperty:string = null,
  defaultValue = null
):IDataProviderMapping {
	return {
		inputProperties,
		mappedProperty:null,
		provider,
		type,
		modelIdProperty,
		idProperty: null
	}
}

export interface IDataComponentHolder {
	mapping:TDataConfigType<any>
	isArray?:boolean
	pendingRequest?:IDataPendingRequest|IDataProviderPendingRequest
	modelMap:{[id:string]:any}
	
	// only for mapped ids
	mappedIds?:any[]
	
	// only for custom provider
	mappedProps?:any
	mappedValue?:any
	
}


/**
 * DataComponent decoration
 *
 * @param dataConfigs
 */
export function DataComponent<P,T extends TDataComponent<P>>
(...dataConfigs:TDataConfigType<P>[]) {
	
	return (target:{new():T}) => {
				
		const newDataComponent = class extends React.Component<any,any> {
			
			constructor(props,context) {
				super(props,context)
			}
			
			render() {
				return <DataComponentWrapper
					{...this.props}
					dataConfigs={dataConfigs}
					dataComponent={target as any}
				/>
			}
		}
		
		PureRender(newDataComponent)
		return newDataComponent as any
	}
}


/**
 * Data component wrapper props
 */
export interface IDataComponentProps<P> extends React.HTMLAttributes<any> {
	dataConfigs:TDataConfigType<P>[]
	dataComponent:TDataComponent<P>
}



/**
 * IDataComponentState
 */
export interface IDataComponentState {
	client?:DataClient
	holders?:IDataComponentHolder[],
	mappedProps?:{[name:string]:any|any[]}
}

/**
 * DataComponent
 *
 * @class DataComponent
 * @constructor
 **/

class DataComponentWrapper extends React.Component<IDataComponentProps<any>,IDataComponentState> {
	
	constructor(props = {},context = {}) {
		super(props as any,context)
	}
	
	makeMappedProps(holders:IDataComponentHolder[]) {
		return holders
			.reduce((props, holder) => {
				const
					{mapping, modelMap, mappedIds, mappedValue,isArray} = holder,
					{mappedProperty, defaultValue} = mapping
				
				let propValue
				
				// CUSTOM PROVIDER
				if (isProviderMapping(mapping)) {
					const resultMap = mappedValue || defaultValue
					log.info(`Setting props`,resultMap)
					
					Object
						.entries(resultMap || {})
						.forEach(([key,val]) => props[key] = val)
					
					
				}
				
				// MAPPING PROVIDER
				else {
					const models = mappedIds
						.map(modelId => modelMap[ modelId ])
					
					propValue = models.length === 0 || !models[ 0 ] ?
						defaultValue :
						!isArray ?
							models[ 0 ] :
							models
					
					log.info(`Mapped models`,mappedIds,models,mappedProperty)
					log.info(`Setting ${mappedProperty} to`,propValue)
					
					props[mappedProperty] = propValue
				}
				
				
				
				return props
			}, {})
	}
	
	sendProviderRequest(
		holders:IDataComponentHolder[],
		holder:IDataComponentHolder,
		request:IDataProviderRequest
	):IDataProviderPendingRequest {
		const
			{ mappedValue } = holder,
			{
				provider,
				props
			} = request
			
		return assign(request,{
			promise: provider(props)
				.then((newValue) => {
					if (newValue === mappedValue || _.isEqual(newValue,mappedValue)) {
						log.info(`No change in result`,mappedValue)
						return
					}
					
					holder.mappedValue = newValue
					this.setState({
						mappedProps: this.makeMappedProps(holders) as any
					})
				})
		})
	}
	
	sendMappingRequest(
		holders:IDataComponentHolder[],
		holder:IDataComponentHolder,
		client:DataClient,
		request:IDataRequest
	):IDataPendingRequest {
		const
			{mapping,modelMap} = holder,
			{modelIdProperty} = mapping
		
		return assign(request,{
			promise: client
				.request(request)
				.then((models) => {
					if (client.killed)
						return
					
					log.info(`Got data, filtering for ids`, models, holder.mappedIds)
					models = models.filter(model => model && holder.mappedIds.includes(`${model[modelIdProperty]}`))
					
					let updates = false
					
					log.info(`Checking for new models`)
					for (let model of models) {
						const
							modelId = model[modelIdProperty],
							existingModel = modelMap[modelId],
							modelsEqual = !!existingModel && _.isEqual(model,existingModel)
						
						updates = updates || !modelsEqual
						modelMap[modelId] = model
					}
					
					log.info(`Checking for old models`)
					const
						removedModelIds = Object
							.keys(modelMap)
							.filter(modelId => !holder.mappedIds.includes(modelId))
					
					log.info(`Removing model keys`,removedModelIds)
					removedModelIds.forEach(modelId => delete modelMap[modelId])
					
					updates = updates || removedModelIds.length > 0
					
					log.info(`Updates received: ${updates}`,modelMap)
					if (updates) {
						this.setState({
							mappedProps: this.makeMappedProps(holders) as any
						})
						//this.forceUpdate()
					}
					
				})
				.catch(err => {
					log.error(`Failed to retrieve data`, err)
				})
		})
	}

	
	updateData = (props = this.props) => {
		const
			{dataConfigs} = props,
			state:IDataComponentState = this.state || {} as any,
			client = _.get(state,'client',createDataClient()),
			holders = state.holders || dataConfigs.map(mapping => ({
				mapping,
				modelMap:{}
			})) as IDataComponentHolder[]
		
		
		// Here is where the magic is
		holders.forEach(holder => {
			const
				{
					mapping,
					mappedIds,
					pendingRequest
				} = holder,
				{
					defaultValue,
					idProperty,
					type
				} = mapping
			
			if (isProviderMapping(mapping)) {
				// CUSTOM MAPPING PROVIDER
				const
					{
						inputProperties,
						provider
					} = mapping,
					{
						mappedProps
					} = holder
					
				let newProps
				if (isString(inputProperties) || Array.isArray(inputProperties)) {
						newProps = (Array.isArray(inputProperties) ? inputProperties : [inputProperties])
							.reduce((map,nextProp) => {
								map[nextProp] = props[nextProp]
								return map
							},{})
				} else {
					newProps = inputProperties(props)
				}
					
				
				// Check to see if ids changed
				if (_.isEqual(newProps, mappedProps)) {
					log.debug(`No changed in mapped props, no need to query`)
					return
				}
				
				holder.mappedProps = newProps
				if (pendingRequest) {
					pendingRequest.promise.cancel()
				}
				
				holder.pendingRequest = this.sendProviderRequest(holders,holder,{
					props:newProps,
					provider
				})
				
			} else {
				
				// PROPERTY ID MAPPING
				let
					newIds = isFunction(idProperty) ?
						idProperty(props) :
						props[idProperty]
				
				holder.isArray = Array.isArray(defaultValue)
				
				if (!Array.isArray(newIds))
					newIds = [newIds]
				
				// Make every id a string
				newIds = newIds.map(newId => `${newId}`)
				
				// Check to see if ids changed
				if (_.isEqual(newIds, mappedIds)) {
					log.debug(`No changed in mapped ids, no need to query`)
					return
				}
				
				if (pendingRequest) {
					pendingRequest.promise.cancel()
				}
				
				// Update the mapped ids
				holder.mappedIds = newIds
				
				// Keep track of it here
				holder.pendingRequest = this.sendMappingRequest(holders, holder, client, {
					ids: newIds,
					type
				})
			}
			
		})
		
		this.setState({
			client,
			holders,
			mappedProps: this.makeMappedProps(holders)
		})
	}
	
	componentWillMount() {
		this.updateData()
	}
	
	componentWillReceiveProps(props) {
		this.updateData(props)
	}
	
	componentWillUnmount() {
		const {client} = this.state
		
		if (client)
			client.kill()
		
		this.setState({
			client:null,
			holders:null,
			mappedProps: null
		})
	}
	
	render() {
		const
			Wrapped = this.props.dataComponent as any,
			{mappedProps} = this.state,
			cleanProps = _.omit(this.props,'dataComponent','dataConfigs')
			
					
				
		//noinspection JSUnusedLocalSymbols
		const Comps ={
			Wrapped
		}
		
		return <Comps.Wrapped {...cleanProps} {...mappedProps}/> as any
	}
	
}