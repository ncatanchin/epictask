
import { nilFilter } from "epic-util/ListUtil"
import { isString } from "typeguard"


const
	log = getLogger(__filename)

/**
 * Create boot dependencies func
 *
 * @param steps
 * @returns {()=>Promise<void>}
 */
export default function makeBootLoader(...steps:any[]) {
	
	steps = nilFilter(steps)
	
	return async () => {
		for (let step of steps) {
			
			const
				parts = Array.isArray(step) ? step : [step],
				results = []
			
			for (let part of parts) {
				if (!part)
					continue
				
				if (isString(part)) {
					log.debug(`Boot: ${part}`)
					continue
				}
				
				let
					result = part()
				
				if (result)
					results.push(Promise.resolve(result))
			}
			
			await Promise.all(results)
			
		}
	}
}