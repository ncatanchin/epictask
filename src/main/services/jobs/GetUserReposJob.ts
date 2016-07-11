
import {Container} from 'typescript-ioc'
import JobService from 'main/services/JobService'

import {JobHandler} from 'shared/actions/jobs/JobHandler'
import {Stores} from 'main/services/DBService'
import {Benchmark, RegisterJob} from 'shared/util/Decorations'
import {GitHubClient} from 'shared/GitHubClient'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Job} from 'shared/actions/jobs/JobState'

const log = getLogger(__filename)

const Benchmarker = Benchmark('SyncAllReposJob')

/**
 * Synchronize all enabled repos
 */
@RegisterJob
export class SyncAllReposJob extends Job {

	constructor(o:any = {}) {
		super(o)

		Object.assign(this, {
			schedule: '*/20 * * * *', // Every 20 minutes
			repeat: true,
			oneAtATime: true,
			scheduled:true,
			immediate:true
		})
	}

	@Benchmarker
	async executor(handler:JobHandler) {
		const {service} = handler

		log.info(`Starting to sync all repos`)

		const stores = Container.get(Stores)
		const repoStore = stores.repo
		const client = Container.get(GitHubClient)

		log.info('Getting all user repos')

		let repos = await client.userRepos({traversePages:true})

		log.info(`Persisting ${repos.length} repos`)
		const beforeCount = await repoStore.count()
		await repoStore.bulkSave(...repos)
		const afterCount = await repoStore.count()

		log.info(`Completed user repo sync, counts before=${beforeCount} and after=${afterCount}`)

		//TODO: when data provider/cache is implemented - invalidate repos here
		// const repoActions = Container.get(RepoActionFactory)
		// repoActions.updateR
	}
}
