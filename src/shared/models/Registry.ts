
const modelClasses = {}

export function registerModel(name,clazz) {
	modelClasses[name] = clazz
}

export function getModel(name) {
	return modelClasses[name]
}
