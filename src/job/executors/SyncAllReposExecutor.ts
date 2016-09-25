
import {JobHandler} from 'job/JobHandler'
import {Stores} from 'shared/services/DatabaseClientService'
import {Benchmark} from 'shared/util/Benchmark'
import {JobExecutor} from 'job/JobDecorations'
import {IJob, JobType, IJobLogger} from "shared/actions/jobs/JobTypes"
import {IJobExecutor} from "job/JobExecutors"
import JobProgressTracker from "job/JobProgressTracker"
import { getRepoActions } from  "shared/actions/ActionFactoryProvider"



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
	async execute(handler:JobHandler,logger:IJobLogger,progressTracker:JobProgressTracker, job:IJob) {
		log.info(`Starting to sync all repos`)

		const
			stores = Container.get(Stores),
			availRepos = await stores.availableRepo.findAll()
			
		
		log.debug('Getting avail repos from DB, not state')

		getRepoActions().syncRepo(
			_.uniq(availRepos.map(availRepo => availRepo.repoId))
		)

	}
}
