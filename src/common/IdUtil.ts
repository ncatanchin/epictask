
import {generate as generateShortId} from 'short-id'

/**
 * Generates v4 UUID
 *
 * @returns {string}
 */
export function uuid():string {
	return require('uuid/v4')()
}


/**
 * Generates a short id
 *
 * @returns {string}
 */
export function shortId():string {
	return generateShortId()
}
