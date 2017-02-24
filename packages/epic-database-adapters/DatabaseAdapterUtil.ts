

/**
 * Clean a store name
 *
 * @param storeName
 * @returns {string}
 */
export function cleanupStoreName(storeName:string) {
	return _.camelCase(storeName.replace(/Store$/i, ''))
}
