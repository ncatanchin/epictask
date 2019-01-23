
import {DataState} from "common/store/state/DataState"
import {createSelector} from "reselect"
import {IOrg} from "common/models/Org"
import {ICollaborator, IRepo} from "common/models/Repo"
import {IDataSet, makeDataSet} from "common/Types"
import getLogger from "common/log/Logger"
import {appSelector} from "common/store/selectors/AppSelectors"
import {IIssue} from "common/models/Issue"
import moment from "moment"

const log = getLogger(__filename)


export function dataSelector<T,P = any>(
	fn:(state:DataState, props?:any) => T
):(state:IRootState,props?:P) => T {
	return (state:IRootState,props:P) => fn(state.DataState,props) as T
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


export const isSelectedRepoEnabledSelector = createSelector(
	appSelector(state => state.enabledRepoIds),
	selectedRepoSelector,
	(enabledRepoIds:Array<number>, selectedRepo:IRepo) => {
		return !!enabledRepoIds && !!selectedRepo && enabledRepoIds.includes(selectedRepo.id)
	}
)


export const selectedIssuesSelector = createSelector(
  dataSelector(state => state.issues),
  appSelector(state => state.selectedIssueIds),
	(issues:IDataSet<IIssue>,ids:Array<number>):Array<IIssue> | null => {
    return !issues || !ids ? [] : ids.map(id => issues.data.find(issue => issue.id === id)).filter(issue => !!issue)
  }
)

export const collaboratorsSelector = dataSelector<Array<ICollaborator>>(state =>
	state.collaborators.data
)

export const issuesSortedAndFilteredSelector = createSelector(
	dataSelector(state => state.issues),
	(issues:IDataSet<IIssue>) => {
		const
			sortedData = [...issues.data]
				.sortBy(issue => moment(issue.updated_at || issue.created_at).valueOf(),true),
			sortedIssues = makeDataSet(sortedData)

		return sortedIssues
	}
)
