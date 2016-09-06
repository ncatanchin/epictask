
import {JobHandler} from 'job/JobHandler'
import {Stores} from 'shared/services/DatabaseClientService'
import {Benchmark} from 'shared/util/Benchmark'
import {JobExecutor} from 'job/JobDecorations'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {IJob, JobType, IJobLogger} from "shared/actions/jobs/JobTypes"
import {IJobExecutor} from "job/JobExecutors"



const log = getLogger(__filename)

const Benchmarker = Benchmark('SyncAllReposJob')

/**
 * Synchronize all enabled repos
 */
@JobExecutor
export class SyncAllReposExecutor implements IJobExecutor {

	static supportedTypes() {
		return [JobType.SyncEnabledRepos]
	}
	
	
	@Benchmarker
	async execute(handler:JobHandler,logger:IJobLogger, job:IJob) {
		log.info(`Starting to sync all repos`)

		const stores = Container.get(Stores)
		const availRepos = await stores.availableRepo.loadAll()
		
		const repoActions:RepoActionFactory = Container.get(RepoActionFactory)
		log.debug('Getting avail repos from DB, not state')

		repoActions.syncRepo(
			_.uniq(availRepos.map(availRepo => availRepo.repoId))
		)

	}
}
