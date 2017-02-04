
import {JobHandler} from '../JobHandler'
import {Stores} from "epic-database-client"
import {Benchmark} from "epic-util"
import {JobExecutor} from '../JobDecorations'
import {IJob, JobType, IJobLogger} from "epic-typedux"
import {IJobExecutor} from "../JobTypes"
import JobProgressTracker from "../JobProgressTracker"
import { getRepoActions } from "epic-typedux"



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
			availRepos = (await stores.availableRepo.findAll()).filter(it => !it.deleted)
			
		
		log.debug('Getting avail repos from DB, not state')

		getRepoActions().syncRepo(
			_.uniq(availRepos.map(availRepo => availRepo.repoId))
		)

	}
}
