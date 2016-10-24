import {isFunction,JSONKey} from "epic-global"


export function toJSONObject(o) {
	const
		names =
			Object.getOwnPropertyNames(o)
				.concat(Object.getOwnPropertyNames(o.__proto__)),
		json = {}
	
	
		names.forEach(name => {
		const
			md = Reflect.getMetadata(JSONKey,o,name)
		if (!md || md && md.jsonInclude) {
			json[name] = o[name]
		}
	})

	return json
}


export function toJSON(o,includeFunctions = false) {
	o = toJSONObject(o)
	
	return JSON.stringify(o,(key,value) => {
		if (isFunction(value)) {
			return includeFunctions ? value.toString() : undefined
		}
		
		return value
	})
}

const
	DATE_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/

/**
 * JSON reviver with date support
 *
 * @see https://blog.mariusschulz.com/2016/04/28/deserializing-json-strings-as-javascript-date-objects
 * @param jsonString
 */
export function parseJSON(jsonString:string) {
	
	function reviver(key, value) {
		if (typeof value === "string" && DATE_FORMAT.test(value)) {
			return new Date(value)
		}
		
		return value
	}
	
	return JSON.parse(jsonString, reviver)
}