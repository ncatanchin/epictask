
import {DataState} from "renderer/store/state/DataState"
import {createSelector} from "reselect"
import {IOrg} from "renderer/models/Org"
import {IRepo} from "renderer/models/Repo"
import {appSelector} from "renderer/store/selectors/AppSelector"
import {IDataSet} from "common/Types"
import getLogger from "common/log/Logger"

const log = getLogger(__filename)


export function dataSelector<T>(
	fn:(state:DataState, props?:any) => T
):(IRootState,any) => T {
	return (state:IRootState,props:any) => fn(state.DataState,props) as T
}


export const selectedOrgSelector = createSelector(
	appSelector(state => state.selectedOrgId),
	dataSelector(state => state.orgs),
	(selectedOrgId:number,orgs:IDataSet<IOrg>):IOrg | null => {
		log.info(`Selected org id = ${selectedOrgId}`, orgs)
		return orgs.data.find(org => org.id === selectedOrgId)
	}
)


export const selectedRepoSelector = createSelector(
	appSelector(state => state.selectedRepoId),
	dataSelector(state => state.repos),
	(selectedRepoId:number,repos:IDataSet<IRepo>):IRepo | null => {
		return repos.data.find(repo => repo.id === selectedRepoId)
	}
)

export const selectedOrgReposSelector = createSelector(
	dataSelector(state => state.repos),
	selectedOrgSelector,
	(repos:IDataSet<IRepo>,selectedOrg:IOrg | null):Array<IRepo> | null => {
		return !selectedOrg ? [] : repos.data.filter(repo => repo.owner.login === selectedOrg.login)
	}
)
