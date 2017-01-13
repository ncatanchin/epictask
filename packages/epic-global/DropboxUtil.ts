import Dropbox = require('dropbox')
import { DropboxClientId } from "./Constants"
import { getValue } from "typeguard"

/**
 * Get dropbox client
 */
export function getDropboxClient() {
	const
		accessToken = getValue(() => getSettings().dropboxToken)
	
	return new Dropbox(accessToken  ? {accessToken } : {clientId: DropboxClientId })
}

/**
 * Dropbox account linked
 *
 * @returns {boolean}
 */
export function isDropboxReady() {
	return getValue(() => !!getSettings().dropboxToken,false)
}