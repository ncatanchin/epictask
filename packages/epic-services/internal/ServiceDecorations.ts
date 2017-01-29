
import {ServiceManager} from "./ServiceManager"
import { ProcessType } from "epic-entry-shared/ProcessType"

const
	log = getLogger(__filename)

/**
 * Annotation to register a service
 * on compilation
 *
 * @param processTypes - a list of process types the service supports,
 *  if none provided then assumed it loads for all
 *
 * @return {(target:IServiceConstructor) => void}
 */
export function RegisterService(...processTypes:ProcessType[]) {
	
	return (target:IServiceConstructor) => {
		
		// Check to see if this service loads for this process type
		// If no process types provide then it loads for all
		if (processTypes.length > 0 && !ProcessConfig.isType(...processTypes)) {
			log.info(`Service (${target.name}) does not load in process type ${ProcessConfig.getTypeName()}`)
			return
		}
		log.info(`REGISTERING Service (${target.name}) for process type ${ProcessConfig.getTypeName()}`)
		
		const manager = ServiceManager.getInstance()
		
		manager.register(target)
	}
	
}