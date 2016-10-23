
import {JobHandler} from '../JobHandler'
import {Stores} from '../../shared/services/DatabaseClientService'
import {Benchmark} from '../../shared/util/Benchmark'
import {JobExecutor} from '../JobDecorations'
import {GitHubClient} from '../../shared/GitHubClient'
import {Repo} from '../../shared/models/Repo'
import {getSettings} from '../../shared/settings/Settings'
import {IJobExecutor} from "../JobExecutors"
import {JobType, IJobLogger} from "../../shared/actions/jobs/JobTypes"
import {IJob} from "../../shared/actions/jobs/JobTypes"
import JobProgressTracker from "../JobProgressTracker"


const log = getLogger(__filename)

const Benchmarker = Benchmark('GetUserReposJob')

/**
 * Synchronize all enabled repos
 */
@JobExecutor
export class GetUserReposExecutor implements IJobExecutor {
	
	/**
	 * Supported Job Types
	 *
	 * @returns {JobType[]}
	 */
	static supportedTypes() {
		return [JobType.GetUserRepos]
	}
	
	@Benchmarker
	getReposFromGitHub():Promise<Repo[]> {
		const client = Container.get(GitHubClient)

		log.info('Getting all user repos')

		return client.userRepos({traversePages:true})

	}

	@Benchmarker
	async execute(handler:JobHandler,logger:IJobLogger,progressTracker:JobProgressTracker,job:IJob) {
		
		if (!getSettings().token) {
			log.info(`User is not authenticated, can not sync`)
			return
		}
		
		logger.info(`Starting to sync all repos`)

		const
			stores = Container.get(Stores),
			repoStore = stores.repo,
			repos = await this.getReposFromGitHub()
			
		logger.info(`Persisting ${repos.length} repos`)
		
		const beforeCount = await repoStore.count()
		await repoStore.bulkSave(...repos)
		const afterCount = await repoStore.count()

		logger.info(`Completed user repo sync, counts before=${beforeCount} and after=${afterCount}`)
	}
}
