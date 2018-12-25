import getLogger from "../../common/log/Logger"
import RepoObjectManager from "renderer/db/RepoObjectManager"
import {ObjectEvent} from "renderer/db/ObjectManager"
import {isNumber} from "typeguard"
import {IRepo} from "renderer/models/Repo"
import {DataActionFactory} from "renderer/store/actions/DataActionFactory"
import {AppActionFactory} from "renderer/store/actions/AppActionFactory"
import OrgObjectManager from "renderer/db/OrgObjectManager"
import {IOrg} from "renderer/models/Org"

const log = getLogger(__filename)

const setRepos = async (_event:ObjectEvent, _repos:Array<IRepo>):Promise<void> => {
	const repos = await (await RepoObjectManager()).all()
	new DataActionFactory().setRepos(repos)
	
	if (repos.length && !getStoreState().AppState.selectedRepoId) {
		new AppActionFactory().setSelectedRepo(repos[0])
	}
}

const setOrgs = async (_event:ObjectEvent, _orgs:Array<IOrg>):Promise<void> => {
	const orgs = await (await OrgObjectManager()).all()
	new DataActionFactory().setOrgs(orgs)
	
	if (orgs.length && !getStoreState().AppState.selectedOrgId) {
		new AppActionFactory().setSelectedOrg(orgs[0])
	}
}

async function init():Promise<void> {
	const repoObjectManager = await RepoObjectManager()
	Object
		.values(ObjectEvent)
		.filter(type => isNumber(type))
		.forEach( type =>
		repoObjectManager.on(type, setRepos)
	)
	
	const orgObjectManager = await OrgObjectManager()
	Object
		.values(ObjectEvent)
		.filter(type => isNumber(type))
		.forEach( type =>
			orgObjectManager.on(type, setOrgs)
		)
	
	await setRepos(ObjectEvent.Loaded, await repoObjectManager.all())
	await setOrgs(ObjectEvent.Loaded, await orgObjectManager.all())
}

export default init()
