import {PouchDBAttributePrefix, PouchDBReservedFields, PouchDBOperators} from './PouchDBConstants'
import {IModel,getDefaultMapper} from 'typestore'

const attrRegex = new RegExp(`^${PouchDBAttributePrefix}`,'g')

export function cleanFieldPrefixes(fields:string[]) {
	return fields.map(field => field.replace(attrRegex,''))
}


export function filterReservedFields(fields:string[]) {
	return fields.filter(field => !PouchDBReservedFields.includes(field))
}

export function mapAttrsToField(fields:string[]) {
	return cleanFieldPrefixes(filterReservedFields(fields))
		.map(field => `${PouchDBAttributePrefix}${field}`)
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