import * as _ from 'lodash'
import {getLogger as LoggerFactory} from 'typelogger'

const log = LoggerFactory(__filename)


/**
 * Extracts the root resource name
 * @example
 * // returns 'CoolComponent'
 * transformKey('./ctx-path/CoolComponent.ts')
 *
 * @param rawKey to transform
 * @return {Array}
 */
function transformKey(rawKey:string) {
	return rawKey.split('/')
		.filter(part => ['.','~'].indexOf(part) === -1)
		.map(part => part.split('.').shift())

}

export function requireContext(ctx,excludes = [],merge = false) {
	const keys = ctx.keys()
	log.debug(`Requiring keys for context ${keys.join(',')}`)

	const modMap = keys.reduce((modMap,rawKey) => {
		const keyPath = transformKey(rawKey)
		if (!keyPath)
			return modMap

		const key = keyPath.join('.')

		for(let exclude of excludes) {
			if (!exclude) continue

			if ((_.isString(exclude) && exclude.toLowerCase() === key.toLowerCase()) ||
				(_.isRegExp(exclude) && exclude.test(key)) ||
				(_.isFunction(exclude) && exclude(key) === true)) {

				log.debug(`Excluding ${key}/${rawKey} with ${exclude}`)
				return modMap
			}
		}

		_.set(modMap,key,ctx(rawKey))
		return modMap
	},{})

	return (merge) ? mergeContext(modMap) : modMap
}

export function mergeContext(modMap) {
	return Object.keys(modMap).reduce((exportMap,modKey) => {
		const mod = modMap[modKey]
		Object.assign(exportMap,/^[A-Z]/.test(modKey) ? {
			[modKey]:mod
		} : mod)
		return exportMap
	},{})
}


export default {
	mergeContext,
	requireContext
}