
import {Container} from 'typescript-ioc'
import {Job, default as JobService} from 'main/services/JobService'
import {BaseJob} from 'shared/actions/jobs/JobReducer'
import {JobHandler} from 'shared/actions/jobs/JobHandler'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Stores} from 'main/services/DBService'
import {Benchmark} from 'shared/util/Decorations'

const log = getLogger(__filename)

const Benchmarker = Benchmark('SyncAllReposJob')

/**
 * Synchronize all enabled repos
 */
@Job
export class SyncAllReposJob extends BaseJob {

	constructor(o:any = {}) {
		super(o)

		Object.assign(this, {
			schedule: '*/10 * * * *', // Every 10 minutes
			repeat: true,
			oneAtATime: true,
			scheduled:true,
			immediate:true

		})
	}


	@Benchmarker
	async executor(handler:JobHandler) {
		log.info(`Starting to sync all repos`)

		const stores = Container.get(Stores)
		const availRepos = await stores.availableRepo.loadAll()
		const service = Container.get(JobService)

		log.debug('Getting avail repos from DB, not state')

		availRepos.forEach(availRepo => {
			service.createJob({
				id: `Sync Repo ${availRepo.repo.full_name}`,
				name: "RepoSyncJob",
				args: {
					availableRepo: availRepo
				}
			})
		})
	}
}
