


import {DatabaseClientService} from 'shared/services/DatabaseClientService'
import {User} from 'shared/models/User'

const log = getLogger(__filename)

let dbService:DatabaseClientService

xdescribe('Database Service',() => {
	before(async () => {
		log.info(`Loading database service`)
		await MainTestSetup.configureMain(DatabaseClientService)

		dbService = Container.get(DatabaseClientService)
	})

	after(async () => {
		log.info(`Shutting down database service`)
		await MainTestSetup.shutdownMain()
	})

	it(`creates user`,async () => {
		log.info('Create user')
		let user = new User({
			id: 1,
			login: 'jonny',
			repoIds:[],
			name: 'shortcircuit'
		})

		user = await dbService.stores.user.save(user)
		expect((user as any).$$_doc).not.toBeNull()
	})

	it(`gets users`,async () => {
		log.info('Getting users')
		const users = await dbService.stores.user.findAll()
		expect(users.length).toEqual(1)
	})
})
