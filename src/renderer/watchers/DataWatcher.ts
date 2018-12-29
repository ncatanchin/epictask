import getLogger from "common/log/Logger"
import RepoObjectManager from "renderer/db/RepoObjectManager"
import IssueObjectManager from "renderer/db/IssueObjectManager"
import {ObjectEvent} from "renderer/db/ObjectManager"
import {getValue, isDefined, isNumber} from "typeguard"
import {IRepo} from "renderer/models/Repo"

import OrgObjectManager from "renderer/db/OrgObjectManager"
import {IOrg} from "renderer/models/Org"
import {selectedOrgSelector, selectedRepoSelector} from "renderer/store/selectors/DataSelectors"
import getPersonalOrg from "renderer/models/PersonalOrg"
import {AppState} from "renderer/store/state/AppState"
import {DataState} from "renderer/store/state/DataState"
import {IIssue} from "renderer/models/Issue"
import * as _ from 'lodash'
import EventHub from "common/events/Event"
import {DataActionFactory} from "renderer/store/actions/DataActionFactory"
import {AppActionFactory} from "renderer/store/actions/AppActionFactory"

const log = getLogger(__filename)

async function getAppActions():Promise<AppActionFactory> {
	const {AppActionFactory} = await import("../store/actions/AppActionFactory")
	return new AppActionFactory()
}

async function getDataActions():Promise<DataActionFactory> {
	const {DataActionFactory} = await import("../store/actions/DataActionFactory")
	return new DataActionFactory()
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
	if (!getStoreState().AppState.user) return
	const
		dataActions = await getDataActions()
	
	if (syncedAt > 0 && repos.length) {
		dataActions.setDataSynced("repos", repos.map(repo => repo.id), syncedAt)
	}
	
	repos = await (await RepoObjectManager())
		.table
		.orderBy("url")
		.toArray()

	dataActions.setRepos(_.sortBy(repos,'full_name'))
	
	const
		repoId = getStoreState().AppState.selectedRepoId,
		appActions = await getAppActions()
	
	if (!repos.length) {
		appActions.setSelectedRepoId(null)
	} else if (!repoId || !repos.find(repo => repo.id === repoId)) {
		appActions.setSelectedRepo(repos[0])
	}
}

const setIssues = async (_event:ObjectEvent | null = null, syncedAt:number = 0, issues:Array<IIssue> = []):Promise<void> => {
	if (!getStoreState().AppState.user) return
	const
		dataActions = await getDataActions(),
		repo = selectedRepoSelector(getStoreState(),{})
	
	// if (syncedAt > 0 && issues.length) {
	// 	const
	// 		repoUrls = _.uniq(issues.map(issue => issue.repository_url)),
	// 		repoIds = (await Promise.all(repoUrls.map(async (url) => {
	// 			const
	// 				manager = await RepoObjectManager(),
	// 				repos = await manager.table.where("url").equals(url).toArray()
	// 			return getValue(() => repos[0].id,null)
	// 		}))).filter(id => isDefined(id))
	//
	// 	dataActions.setDataSynced("issues", repoIds, syncedAt)
	// }
	
	issues = Array<IIssue>()
	if (!repo) {
		log.warn("No current repo")
	} else {
		const manager = await IssueObjectManager()
		issues = await manager
			.table
			.where("repository_url")
			.equals(repo.url)
			.toArray()
	}
	
	dataActions.setIssues(issues)
	
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
		personalOrg = getPersonalOrg()
	
	if (!personalOrg) return
	
	if (syncedAt > 0 && orgs.length) {
		dataActions.setDataSynced("orgs", orgs.map(org => org.id), syncedAt)
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

/**
 * Initializes all listeners etc
 */
async function init():Promise<void> {
	const repoObjectManager = await RepoObjectManager()
	const orgObjectManager = await OrgObjectManager()
	const issueObjectManager = await IssueObjectManager()
	
	// LISTENER FOR ISSUE SYNC EVENTS
	EventHub.on("RepoIssuesSynced",async (repoId:number, timestamp:number) =>
		(await getDataActions()).setDataSynced("issues",[repoId],timestamp)
	)
	
	Object
		.values(ObjectEvent)
		.filter(type => isNumber(type))
		.forEach( (type:ObjectEvent) =>
		repoObjectManager.on(type, async () => {
			try {
				await setRepos(null, -1)
				switch (type) {
					case ObjectEvent.Synced:
						await issueObjectManager.sync()
						break
				}
			} catch (err) {
				log.error("Unable to handle event",ObjectEvent[type],err)
			}
		})
	)
	
	
	Object
		.values(ObjectEvent)
		.filter(type => isNumber(type))
		.forEach((type:ObjectEvent) => orgObjectManager.on(type, setOrgs))
	
	Object
		.values(ObjectEvent)
		.filter(type => isNumber(type))
		.forEach((type:ObjectEvent) => issueObjectManager.on(type, setIssues))
	
	getStore().observe([AppState.Key,'selectedOrgId'],() => setRepos(null,-1))
	getStore().observe([AppState.Key,'user'],async () => {
		await Promise.all([
			orgObjectManager.sync(),
			repoObjectManager.sync()
		])
	})
	getStore().observe([DataState.Key,'orgs','data'], async () => {
		await repoObjectManager.sync()
	})
	getStore().observe([AppState.Key,'selectedRepoId'],() =>
		setIssues(null,-1)
	)
	getStore().observe([AppState.Key,'enabledRepoIds'], async () => {
		await Promise.all([
			issueObjectManager.sync(),
			setIssues(null, -1)
		])
	})
	
	
	
	await setOrgs(ObjectEvent.Synced, -1, [])
	await setRepos(ObjectEvent.Synced, -1, [])
	await setIssues(ObjectEvent.Synced, -1, [])
}

export default init()
