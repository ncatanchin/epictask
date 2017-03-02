
import {List} from 'immutable'
import { toNumber } from "typeguard"
import { notifyError, notifyInfo } from "epic-global"

const
	log = getLogger(__filename),
	APIRateLimit = 250,
	APIRateLimitDuration = 60000

let
	APICallHistory = List<any>(),
	githubRateLimitInfo:any

/**
 * Get Current info
 *
 * @returns {any}
 */
export function getRateLimitInfo() {
	return githubRateLimitInfo
}

/**
 * Get formatted rate limit info
 *
 * @returns {string}
 */
export function getRateLimitInfoAsString() {
	const
		{rateLimit,rateLimitRemaining,rateLimitResetTimestamp} = githubRateLimitInfo
	
	return `limit=${rateLimit},remaining=${rateLimitRemaining},resets=${new Date(rateLimitResetTimestamp)}`
}


/**
 * Check the current rate limit is exhausted
 * is exhausted throw error
 */
export function checkRateLimit(url:string) {
	if (APICallHistory.size > APIRateLimit) {
		APICallHistory = APICallHistory.filter(apiCall => apiCall.timestamp > Date.now() - APIRateLimitDuration) as List<any>
		
		if (APICallHistory.size > APIRateLimit) {
			log.error(`Local rate limit exceeded: ${APICallHistory.size}`, APICallHistory.toArray())
			notifyError(`Overrate limit ${APICallHistory.size} in ${APIRateLimitDuration / 1000}s`)
			
			throw new Error(`Overrate limit ${APICallHistory.size} in ${APIRateLimitDuration / 1000}s`)
		}
	}
	
	APICallHistory.push({
		url,
		timestamp: Date.now()
	})
}

/**
 * Update the rate limit from response headers
 *
 * @param response
 */
export function updateRateLimit(response) {
	const
		{headers} = response
	
	let
		rateLimit = toNumber(headers.get('X-RateLimit-Limit'))
	
	if (rateLimit) {
		const
			rateLimitRemaining = toNumber(headers.get('X-RateLimit-Remaining')),
			rateLimitResetTimestamp = toNumber(headers.get('X-RateLimit-Reset')) * 1000
		
		githubRateLimitInfo = {
			rateLimit,
			rateLimitRemaining,
			rateLimitResetTimestamp
		}
		
		if (rateLimit - rateLimitRemaining > (rateLimit / 3) * 2)
			notifyInfo(`Github Rate Limit is less than 50%, limit=${rateLimit} remaining=${rateLimitRemaining} resets @ ${new Date(rateLimitResetTimestamp)}`)
		
	}
}

