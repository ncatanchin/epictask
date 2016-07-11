
import {Container} from 'typescript-ioc'
import JobService from 'main/services/JobService'

import {JobHandler} from 'shared/actions/jobs/JobHandler'
import {Stores} from 'main/services/DBService'
import {Benchmark, RegisterJob} from 'shared/util/Decorations'
import {Job} from 'shared/actions/jobs/JobState'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'

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
			schedule: '*/10 * * * *', // Every 10 minutes
			repeat: true,
			oneAtATime: true,
			scheduled:true,
			immediate:false
		})
	}

	@Benchmarker
	async executor(handler:JobHandler) {
		log.info(`Starting to sync all repos`)

		const stores = Container.get(Stores)
		const availRepos = await stores.availableRepo.loadAll()
		const service = Container.get(JobService)
		const repoActions:RepoActionFactory = Container.get(RepoActionFactory)
		log.debug('Getting avail repos from DB, not state')

		availRepos.forEach(availRepo => repoActions.syncRepo(availRepo.repoId))

	}
}
