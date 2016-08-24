
import {IServiceConstructor} from "./Types"
import {ServiceManager} from "./ServiceManager"
import ProcessType from "shared/ProcessType"

const log = getLogger(__filename)

/**
 * Annotation to register a service
 * on compilation
 *
 * @param processTypes - a list of process types the service supports
 * @return {(target:IServiceConstructor) => void}
 */
export function RegisterService(...processTypes:ProcessType[]) {
	
	return (target:IServiceConstructor) => {
		
		// Check to see if this service loads for this process type
		if (!ProcessConfig.isType(...processTypes)) {
			log.info(`Service (${target.name}) does not load in process type ${ProcessConfig.getTypeName()}`)
			return
		}
		
		const manager = ServiceManager.getInstance()
		
		manager.register(target.name,target)
	}
	
}