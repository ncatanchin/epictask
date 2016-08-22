
import DBService from '../../shared/services/DatabaseService'
import ActivityManagerService from '../../shared/services/ActivityManagerService'
import {Container} from 'typescript-ioc'
import {User} from 'shared/models/User'
import {Issue} from 'shared/models/Issue'
import {Repo} from 'shared/models/Repo'

import {createClient} from "shared/GitHubClient"
import {RepoSyncJob as RepoSyncJobType} from "../../server/services/jobs/RepoSyncJob"

const log = getLogger(__filename)

// Github client
const client = createClient(process.env.GITHUB_API_TOKEN)

// Get Angular Repo
const getAngular = ():Promise<Repo> => {
	return client.repo('angular/angular')
}

let dbService:DBService

// RepoSync Test Suite
describe('RepoSyncJob tests',() => {
	before(async () => {
		log.info(`Loading database service`)
		await MainTestSetup.configureMain(DBService,ActivityManagerService)

		dbService = Container.get(DBService)
	})
	
	after(async () => {
		log.info(`Shutting down database service`)
		await MainTestSetup.shutdownMain()
	})
	
	/**
	 * Test sync repo, nocked if not avail
	 */
	it('Get Repo', async () => {
		nock(/github/)
			.get(/\/repos\/angular\/angular/)
			.reply(200,require('./fixtures/getRepoResponse.json'))
	
		const angularRepo = await getAngular()
		log.info('Angular repo', angularRepo)
		
		expect(angularRepo).not.toBeNull()
		expect(angularRepo.organization.login).toBe('angular')
		
	})
	
	/**
	 * Real sync assignees test, disabled by default
	 */
	xit('Sync.Assignees',async() => {
		const angularRepo = await getAngular()
		const {RepoSyncJob} = require('main/services/jobs/RepoSyncJob')
		const job = new RepoSyncJob({
			id: 'job-1',
			name: 'sync-assignee-test',
			args: {
				repo: angularRepo,
				dryRun:true
			}
		}) as RepoSyncJobType
		
		// Set the client to use
		job.client = client
		
		// Sync Assignees
		const users:User[] = await job.syncAssignees(null,angularRepo)
		
		log.info(`Collaborator count ${users.length}`)
		expect(users.length).toBeGreaterThan(159)
	})
	
	/**
	 * Real issue sync test, disabled by default
	 */
	xit('Sync.Issues', async() => {
		const angularRepo = await getAngular()
		const {RepoSyncJob} = require('main/services/jobs/RepoSyncJob')
		const job = new RepoSyncJob({
			id: 'job-2',
			name: 'sync-issues-test',
			args: {
				repo: angularRepo,
				dryRun:true
			}
		}) as RepoSyncJobType
		
		// Set the client to use
		job.client = client
		
		// Sync Assignees
		const issues:Issue[] = await job.syncIssues(null,angularRepo)
		const openIssues = issues.filter(issue => issue.state === 'open')
		expect(openIssues.length).toBe(angularRepo.open_issues_count)
		
	})
	
	
	
})