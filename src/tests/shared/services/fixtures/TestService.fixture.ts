

import {ProcessType} from "shared/ProcessType"
import {RegisterService, BaseService, IServiceConstructor} from "shared/services"

const log = getLogger(__filename)

@RegisterService(ProcessType.Test)
export class TestService1 extends BaseService {
	
	
	dependencies(): IServiceConstructor[] {
		return [TestService2]
	}
	
	start(): Promise<this> {
		log.info("Starting service1")
		return super.start()
	}
}

@RegisterService(ProcessType.Test)
export class TestService2 extends BaseService {
	
	
	dependencies(): IServiceConstructor[] {
		return []
	}
	
	start(): Promise<this> {
		log.info("Starting service2")
		return super.start()
	}
}