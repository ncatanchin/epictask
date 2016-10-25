

export function lexicographicDateFormat(date:Date) {
	return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-${date.getUTCMilliseconds()}`
}