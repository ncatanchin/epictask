import { ObservableStore } from "typedux"
import { ProcessType, IssueKey } from "epic-global"
import { getIssueActions, getRepoActions } from "epic-typedux"
import { getStores } from "epic-database-client"
import { acceptHot } from "epic-global/HotUtils"
import {
	addDatabaseChangeListener, removeDatabaseChangeListener
} from "epic-database-client/DatabaseClient"
import { Issue,User ,Milestone,Label ,AvailableRepo,Comment ,Repo } from "epic-models"

import { BaseService, IServiceConstructor, RegisterService } from "epic-services/internal"
import { DatabaseClientService } from "epic-services/DatabaseClientService"
import { nilFilter } from "epic-global/ListUtil"
import { changesToModels, changesToDeletedIds } from "epic-database-client/DatabaseUtil"
import { getAppActions } from "epic-typedux/provider/ActionFactoryProvider"
import { getValue } from "epic-global/ObjectUtil"
import { Settings } from "epic-global/settings/Settings"
import {Map} from 'immutable'

const
	log = getLogger(__filename)

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Manages data state changes and takes appropriate action
 */
@RegisterService(ProcessType.UI,ProcessType.JobServer)
export class UIModelWatcherService extends BaseService {
	
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	/**
	 * Clean the repo state listeners
	 */
	private clean() {
		this.listeners.forEach((listener,clazz) =>
			removeDatabaseChangeListener(clazz,listener))
	}
	
	/**
	 * Init the store
	 *
	 * @returns {Promise<BaseService>}
	 */
	async init():Promise<this> {
		
		return super.init()
	}
	
	
	
	
	/**
	 * On start load available repos
	 *
	 * @returns {UIModelWatcherService}
	 */
	async start():Promise<this> {
		await super.start()
		
		// ADD DB CHANGE LISTENERS FIRST
		this.listeners.forEach((listener,clazz) => {
			addDatabaseChangeListener(clazz,listener)
		})
		
		if (module.hot) {
			module.hot.dispose(() => this.clean())
		}
		
		return this
	}
	
	/**
	 * Stop the service
	 *
	 * @returns {Promise<BaseService>}
	 */
	async stop():Promise<this> {
		this.clean()
		return super.stop()
		
	}
	
	/**
	 * Destroy the service
	 *
	 * @returns {UIModelWatcherService}
	 */
	destroy():this {
		this.clean()
		return this
	}
	
	
	/**
	 *
	 * @param changes
	 */
	private onRepoChange = (changes:IDatabaseChange[]) => {
		log.debug(`on repo change`,changes)
		
		getRepoActions().updateRepos(
			changesToModels<Repo>(changes)
		)
	}
	
	/**
	 * On available repo changes, enable or deleted really
	 *
	 * @param changes
	 */
	private onAvailRepoChange = (changes:IDatabaseChange[]) => {
		log.debug(`on avail repo change`,changes)
		
		getRepoActions().onAvailableRepoChanges(
			changesToModels<AvailableRepo>(changes),
			changesToDeletedIds(changes)
		)
	}
	
	/**
	 * on label changes
	 *
	 * @param changes
	 */
	private onLabelChange = (changes:IDatabaseChange[]) => {
		log.debug(`on label change`,changes)
		
		getRepoActions().updateLabels(
			changesToModels<Label>(changes),
			changesToDeletedIds(changes)
		)
	}
	
	/**
	 * on milestone changed
	 *
	 * @param changes
	 */
	private onMilestoneChange = (changes:IDatabaseChange[]) => {
		log.debug(`on milestone change`,changes)
		
		getRepoActions().updateMilestones(
			changesToModels<Milestone>(changes),
			changesToDeletedIds(changes)
		)
	}
	
	/**
	 * On user change
	 *
	 * @param changes
	 */
	private onUserChange = (changes:IDatabaseChange[]) => {
		log.debug(`on user change`,changes)
		
		const
			settings = getSettings()
		
		if (!settings)
			return
		
		const
			userId = getValue(() => settings.user.id,null),
			users = changesToModels<User>(changes),
			userChange = userId && users.find(it => it.id === userId)
		
		if (userChange) {
			log.info(`App user info changed`,userChange)
			const
				appActions = getAppActions(),
				{settings} = appActions.state
					
			appActions.setSettings(settings.set('user',userChange) as Settings)
			
		}
		
			
			
			
			getRepoActions().updateCollaborators(users)
	}
	
	/**
	 * On comments changed
	 *
	 * @param changes
	 */
	private onCommentChange = (changes:IDatabaseChange[]) => {
		log.debug(`on comment change`,changes)
		
		
		//getIssueActions().commentsChanged(...changesToModels<Comment>(changes))
	}
	
	/**
	 * Issues updated
	 *
	 * @param changes
	 */
	private onIssueChange = (changes:IDatabaseChange[]) => {
		log.debug(`on issue change`,changes)
		
		//getIssueActions().reloadIssues(changesToModels<Issue>(changes))
	}
	
	private listeners = Map<IModelConstructor<any>,TDatabaseChangeListener>({
		[Repo.$$clazz]: this.onRepoChange,
		[AvailableRepo.$$clazz]: this.onAvailRepoChange,
		[Label.$$clazz]: this.onLabelChange,
		[Milestone.$$clazz]: this.onMilestoneChange,
		[Comment.$$clazz]: this.onCommentChange,
		[Issue.$$clazz]: this.onIssueChange,
		[User.$$clazz]: this.onUserChange
		
	} as {[type:string]:TDatabaseChangeListener})
}

export default UIModelWatcherService


acceptHot(module,log)