import {PouchDBAttributePrefix, PouchDBReservedFields, PouchDBOperators} from './PouchDBConstants'
import {IModel,IModelType,getDefaultMapper} from 'typestore'
import {PouchDBKeyValue} from './PouchDBRepoPlugin'
import {IModelMapper} from '../../typestore/src/Types'

const attrRegex = new RegExp(`^${PouchDBAttributePrefix}`,'g')

export function cleanFieldPrefixes(fields:string[]) {
	return fields.map(field => field.replace(attrRegex,''))
}


export function filterReservedFields(fields:string[]) {
	return fields.filter(field => !PouchDBReservedFields.includes(field))
}

export function mapAttrsToField(fields:string[]) {
	return cleanFieldPrefixes(filterReservedFields(fields))
		.map(field => `${PouchDBAttributePrefix}${field}` )
}

export function keyFromObject(o:any):PouchDBKeyValue {
	return new PouchDBKeyValue(o[this.primaryKeyAttr])
}

export function dbKeyFromObject(primaryKeyAttribute:string,o:any):string {
	const key = o[primaryKeyAttribute]
	return (key) ? '' + key : null
}

export function dbKeyFromKey(key:PouchDBKeyValue) {
	return key.args[0]
}



export function convertModelToDoc(
	modelType:IModelType,
	modelMapper:IModelMapper<any>,
	primaryKeyAttribute:string,
	model:any
) {
	const json = modelMapper.toObject(model)
	const doc = model.$$doc || {} as any

	if (!doc._id) {
		const key = dbKeyFromObject(primaryKeyAttribute,model)
		if (key)
			doc._id = key
	}


	doc.type = modelType.name
	doc.attrs = json

	return doc
}

export function mapDocs<M extends IModel>(modelClazz:{new():M},result:any):M[] {

		const mapper = getDefaultMapper(modelClazz)

		let docs = (result && Array.isArray(result)) ? result : result.docs
		docs = docs || []
		return docs.map(doc => mapper.fromObject(doc.attrs,(o, model) => {
			(model as any).$$doc = doc
			return model
		}))


}


/**
 * Prepends all keys - DEEP
 * with `attrs.` making field reference easier
 * @param o
 * @returns {{}}
 */
export function transformDocumentKeys(o) {
	return (Array.isArray(o)) ?
		o.map(aVal => transformDocumentKeys(aVal)) :
		(typeof o === "object") ?
			Object
				.keys(o)
				.reduce((newObj,nextKey) => {
					const nextVal = o[nextKey]

					nextKey = PouchDBOperators.includes(nextKey) ?
						nextKey : `${PouchDBAttributePrefix}${nextKey}`

					newObj[nextKey] = transformDocumentKeys(nextVal)

					return newObj
				},{}) :
			o

}