import {DatabaseClient} from "shared/db/DatabaseClient"
import WorkerManager from '../../shared/ChildProcessManager'
import {DatabaseClientService as DatabaseClientServiceType} from "shared/services/DatabaseClientService"
import {Repo, User} from "shared/models"
import {Stores} from "shared/Stores"
import angularRepoFixture from 'tests/job/fixtures/angular-repo-response'
const log = getLogger(__filename)






function getClient() {
	return require('shared/db/DatabaseClient').default as DatabaseClient
}

/**
 * Test the server entry, boot, etc
 */
describe('DatabaseServerEntry',() => {
	let clientService:DatabaseClientServiceType = null
	
	/**
	 * Start database server and required services
	 */
	before(async() => {
		log.info('Starting Database Server')
		await WorkerManager.startAll(ProcessType.DatabaseServer)
		
		const DatabaseClientService:typeof DatabaseClientServiceType = require("shared/services/DatabaseClientService").DatabaseClientService
		clientService = new DatabaseClientService()
		await clientService.start()
		
		
	})
	
	/**
	 * Stop server and cleanup
	 */
	after(async() => {
		const client = getClient()
		client.kill()
		
		await clientService.stop()
		await WorkerManager.stopAll()
	})
	
	
	/**
	 * Check the server is running and the client is connected
	 */
	it('Database Server is running', async() => {
		const client = getClient()
		
		log.info(`Waiting for connection`)
		await client.connect()
		
		log.info(`Confirming connected`)
		expect(client.transport.connected).toBe(true)
	})
	
	/**
	 * Create a user
	 */
	it(`Create User (Simple)`,async () => {
		const stores = Container.get(Stores)
		log.info('Create user')
		let user = new User({
			id: 1,
			login: 'jonny',
			repoIds:[],
			name: 'shortcircuit'
		})
		
		user = await stores.user.save(user)
		expect((user as any).$$_doc).not.toBeNull()
	})
	
	/**
	 * Query users
	 */
	it(`Get Users (Simple)`,async () => {
		const stores = Container.get(Stores)
		log.info('Getting users')
		const users = await stores.user.findAll()
		expect(users.length).toEqual(1)
	})
	
	
	/**
	 * FULL CRUD
	 */
	it('CRUD',async () => {
		const
			angularRepo = new Repo(angularRepoFixture),
			stores = Container.get(Stores)
		
		log.info('Clearing existing repo just in case')
		await stores.repo.remove(angularRepo.id)
		
		log.info('Checking for existing repo')
		const existingRepo = await stores.repo.get(angularRepo.id)
		expect(existingRepo).toBeNull()
		
		log.info('Creating repo')
		const newRepo = await stores.repo.save(angularRepo)
		expect(newRepo).not.toBeNull()
		
		log.info('Checking repo exists')
		const foundRepo = await stores.repo.get(angularRepo.id)
		expect(foundRepo).not.toBeNull()
		
		log.info('Deleting repo')
		await stores.repo.remove(angularRepo.id)
		
		log.info('Checking repo does not exist')
		const deletedRepo = await stores.repo.get(angularRepo.id)
		expect(deletedRepo).toBeNull()
	})
})