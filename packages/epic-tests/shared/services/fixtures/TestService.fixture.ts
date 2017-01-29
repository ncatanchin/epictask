

import {ProcessType} from "epic-global"
import {RegisterService, BaseService} from "epic-services"

const log = getLogger(__filename)

@RegisterService(ProcessType.Test)
export class TestService1 extends BaseService {
	
	static readonly ServiceName = "TestService1"
	
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
	
	static readonly ServiceName = "TestService2"
	
	dependencies(): IServiceConstructor[] {
		return []
	}
	
	start(): Promise<this> {
		log.info("Starting service2")
		return super.start()
	}
}