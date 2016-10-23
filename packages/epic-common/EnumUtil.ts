

function isNumberValue(o:any) {
	try {
		return _.isNumber(parseInt(o,10))
	} catch (err) {
		return false
	}
}

export function enumKeys(enumType:any) {
	return Object.keys(enumType).filter(key => isNumberValue(key))
}

export function enumValues(enumType:any) {
	return Object.keys(enumType).filter(key => !isNumberValue(key))
}
