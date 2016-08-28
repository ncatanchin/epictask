

import {ServiceManager} from "shared/services"
import * as TestServicesType from './fixtures/TestService.fixture'

//let getServiceManager:typeof getServiceManagerType = null
let serviceManagerRef = null
function getServiceManager(clear = false):ServiceManager {
	
	// If clear then clear
	clear && clearRequireCache()
	
	return serviceManagerRef = require('shared/services').getServiceManager()
}

const log = getLogger(__filename)

describe('Services',() => {
	
	beforeEach(async () => {
		ProcessConfig.setType(ProcessType.Test)
	})
	
	it('Load types based on env', async () => {
		
		expect(ProcessConfig.getType()).toBe(ProcessType.Test)
		
		let serviceManager
		
		const countRegistered = (expected) =>
			expect(Object.keys(getServiceManager().getRegistrations()).length).toBe(expected)
		
		log.info(`Check ProcessType=${ProcessConfig.getTypeName()} - without test services`)
		countRegistered(0)
		
		require('./fixtures/TestService.fixture')
		log.info(`Check ProcessType=${ProcessConfig.getTypeName()} - with test services`)
		countRegistered(2)
		
		log.info('Removing all and going to type Main')
		serviceManager = getServiceManager(true)
		ProcessConfig.setType(ProcessType.Main)
		log.info('Loading service context in type main - only DatabaseClientService should load')
		serviceManager.loadContext()
		countRegistered(2)
		
		log.info('Removing all and going to type Server')
		serviceManager = getServiceManager(true)
		ProcessConfig.setType(ProcessType.StateServer)
		log.info('Loading service context in type main - only DatabaseClientService should load')
		serviceManager.loadContext()
		countRegistered(7)
		
		
		log.info('Removing all and going to type DatabaseServer')
		serviceManager = getServiceManager(true)
		ProcessConfig.setType(ProcessType.DatabaseServer)
		log.info('Loading service context in type main - only DatabaseClientService should load')
		serviceManager.loadContext()
		countRegistered(1)
		
	})
	
	
	it('Dep based load order', async () => {
		
		const
			serviceManager = getServiceManager(true),
			TestServices = require('./fixtures/TestService.fixture') as typeof TestServicesType
			
			
		const regs = serviceManager.getRegistrations()
		expect(regs.length).toBe(2)
		expect(regs[0].serviceConstructor).toBe(TestServices.TestService2)
		expect(regs[1].serviceConstructor).toBe(TestServices.TestService1)
		
	})
})