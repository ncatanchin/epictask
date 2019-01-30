import getLogger from "common/log/Logger"
import RepoObjectManager from "renderer/db/RepoObjectManager"
import IssueObjectManager from "renderer/db/IssueObjectManager"
import {ObjectEvent} from "renderer/db/ObjectManager"
import {isNumber} from "typeguard"
import {IRepo} from "common/models/Repo"

import OrgObjectManager from "renderer/db/OrgObjectManager"
import {IOrg} from "common/models/Org"
import {selectedRepoSelector} from "common/store/selectors/DataSelectors"
import getPersonalOrg from "common/models/PersonalOrg"
import {AppState} from "common/store/state/AppState"
import {DataState} from "common/store/state/DataState"
import {IIssue} from "common/models/Issue"
import * as _ from 'lodash'
import EventHub from "common/events/Event"
import {DataActionFactory} from "common/store/actions/DataActionFactory"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import delay from "common/util/Delay"
import db from "renderer/db/ObjectDatabase"
import {getIssueEvents} from "renderer/net/IssueAPI"

const log = getLogger(__filename)

async function getAppActions():Promise<AppActionFactory> {
	const {AppActionFactory} = await import("common/store/actions/AppActionFactory")
	return new AppActionFactory()
}

async function getDataActions():Promise<DataActionFactory> {
	const {DataActionFactory} = await import("common/store/actions/DataActionFactory")
	return new DataActionFactory()
}

async function loadSelectedIssueData(issueIds = getStoreState().AppState.selectedIssueIds):Promise<void> {
	if (!issueIds || issueIds.length !== 1) {
		return
	}

	const data = await getIssueEvents(issueIds[0])
	if (data) {
    ;(await getDataActions()).setIssueEventData(data)
  }
}

/**
 * Reload the current
 * repos shown in the app.
 *
 * triggers:
 * - org changes
 * - org selected
 * - repo sync changes
 *
 * @param _event
 * @param syncedAt
 * @param repos
 */
const setRepos = async (_event:ObjectEvent, syncedAt:number, repos:Array<IRepo> = []):Promise<void> => {
	if (!getStoreState().AppState.user) {
		log.warn("User not set")
		return
	}

	const
		dataActions = await getDataActions(),
		appActions = await getAppActions()

	if (syncedAt > 0 && repos.length) {
		appActions.setDataSynced("repos", repos.map(repo => repo.id), syncedAt)
	}

	repos = await (await RepoObjectManager())
		.table
		.orderBy("url")
		.toArray()

	dataActions.setRepos(_.sortBy(repos,'full_name'))
	await delay(10)

	const
		repoId = getStoreState().AppState.selectedRepoId,
		repoExists = !!repos.find(repo => repo.id === repoId)

	if (repos.length && !repoExists) {
		appActions.setSelectedRepo(repos[0])
	}
}

const setIssues = async (_event:ObjectEvent | null = null, syncedAt:number = 0, issues:Array<IIssue> = []):Promise<void> => {
	if (!getStoreState().AppState.user) return
	const
		dataActions = await getDataActions(),
		repo = selectedRepoSelector(getStoreState())

	if (!repo) {
		log.warn("No current repo")
	} else {
		dataActions.setRepoObjects(
			await db
				.issues
				.where("repository_url")
				.equals(repo.url)
				.toArray(),
      await db
        .labels
        .where("repository_url")
        .equals(repo.url)
        .toArray(),
      await db
        .milestones
        .where("repository_url")
        .equals(repo.url)
        .toArray(),
      await db
        .collaborators
        .where("repository_url")
        .equals(repo.url)
        .toArray(),
		)
	}


}


/**
 * Reload the orgs.
 *
 * triggers:
 * - org sync
 *
 * @param _event
 * @param syncedAt
 * @param orgs
 * @return {Promise<void>}
 */
const setOrgs = async (_event:ObjectEvent, syncedAt:number, orgs:Array<IOrg> = []):Promise<void> => {
	if (!getStoreState().AppState.user) return

	const
		dataActions = await getDataActions(),
		appActions = await getAppActions(),
		personalOrg = getPersonalOrg()

	if (!personalOrg) return

	if (syncedAt > 0 && orgs.length) {
		appActions.setDataSynced("orgs", orgs.map(org => org.id), syncedAt)
	}

	orgs = await (await OrgObjectManager()).all()
	if (!orgs.find(org => !!org.personal)) {
		orgs = [personalOrg,...orgs]
	}

	dataActions.setOrgs(orgs)

	if (orgs.length && !getStoreState().AppState.selectedOrgId) {
		(await getAppActions()).setSelectedOrg(orgs[0])
	}
}

async function syncAll():Promise<void> {
	if (!getStoreState().AppState.user) {
		log.warn("no user, can not sync")
		return
	}

	const orgObjectManager = await OrgObjectManager()
	await orgObjectManager.sync()

	const repoObjectManager = await RepoObjectManager()
	const issueObjectManager = await IssueObjectManager()

	await Promise.all([
		repoObjectManager.sync(),
		issueObjectManager.sync()
	])
}

/**
 * Initializes all listeners etc
 */
async function init():Promise<void> {
	const repoObjectManager = await RepoObjectManager()
	const orgObjectManager = await OrgObjectManager()
	const issueObjectManager = await IssueObjectManager()

	// LISTENER FOR ISSUE SYNC EVENTS
	EventHub.on("RepoIssuesSynced",async (repoId:number, timestamp:number) =>
		(await getAppActions()).setDataSynced("issues",[repoId],timestamp)
	)

	Object
		.values(ObjectEvent)
		.filter(type => isNumber(type))
		.forEach( (type:ObjectEvent) => {
			repoObjectManager.on(type, async () => {
				try {
					await setRepos(null, -1)
					switch (type) {
						case ObjectEvent.Synced:
							await issueObjectManager.sync()
							break
					}
				} catch (err) {
					log.error("Unable to handle event", ObjectEvent[type], err)
				}
			})

			orgObjectManager.on(type, (event) =>
				setOrgs(event,-1).then(async () => {
					await (await RepoObjectManager()).sync()
				})

			)

			issueObjectManager.on(type, setIssues)
		})


	getStore().observe([AppState.Key,'selectedOrgId'],() => setRepos(null,-1))
	getStore().observe([AppState.Key,'user'],() => {
		orgObjectManager.sync().catch(err => log.error("Sync failed", err))
		// syncAll()
		// 	.catch(err => log.error("Sync failed", err))
	})
	getStore().observe([DataState.Key,'orgs','data'], async () => {
		await repoObjectManager.sync()
	})
	getStore().observe([AppState.Key,'selectedRepoId'],() =>
		setIssues(null,-1)
	)
  getStore().observe([AppState.Key,'selectedIssueIds'],() =>
    loadSelectedIssueData()
  )
	getStore().observe([AppState.Key,'enabledRepoIds'], async () => {
		await Promise.all([
			issueObjectManager.sync()
		])
	})

	await loadSelectedIssueData()

	const dataActions = await getDataActions()
	dataActions.setOrgs(await orgObjectManager.table.toArray())
	await delay(1)
	const repos = await repoObjectManager.table.toArray()
	dataActions.setRepos(repos)
	await delay(1)

	const
		repoId = getStoreState().AppState.selectedRepoId,
		repo = repos.find(repo => repo.id === repoId)

	log.info("Loading issues for", repoId, repo)
	if (repo) {
    dataActions.setRepoObjects(
      await db
        .issues
        .where("repository_url")
        .equals(repo.url)
        .toArray(),
      await db
        .labels
        .where("repository_url")
        .equals(repo.url)
        .toArray(),
      await db
        .milestones
        .where("repository_url")
        .equals(repo.url)
        .toArray(),
      await db
        .collaborators
        .where("repository_url")
        .equals(repo.url)
        .toArray(),
    )
	}
	// await setOrgs(ObjectEvent.Synced, -1, [])
	// await setRepos(ObjectEvent.Synced, -1, [])
	// await setIssues(ObjectEvent.Synced, -1, [])

	syncAll().catch(err => log.error("Sync all failed",err))
}

export default init()
