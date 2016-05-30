import {JSONKey} from "../Constants"

export function toJSON(o) {
	const names =
		Object.getOwnPropertyNames(o)
			.concat(Object.getOwnPropertyNames(o.__proto__))

	const json = {}
	names.forEach(name => {
		const md = Reflect.getMetadata(JSONKey,o,name)
		if (md && md.jsonInclude) {
			json[name] = o[name]
		}
	})

	return json
}