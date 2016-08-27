

export function enumKeys(enumType:any) {
	return Object.keys(enumType).filter(key => _.isNumber(key))
}

export function enumValues(enumType:any) {
	return Object.keys(enumType).filter(key => _.isString(key))
}
