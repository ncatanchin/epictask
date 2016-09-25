import {StateLeafKeys} from 'shared/Constants'
import {AppState as AppStateType} from '../actions/app/AppState'
import {AuthState as AuthStateType} from 'shared/actions/auth/AuthState'
import {RepoState as RepoStateType} from 'shared/actions/repo/RepoState'
import {IssueState as IssueStateType} from 'shared/actions/issue/IssueState'
import {JobState as JobStateType} from 'shared/actions/jobs/JobState'
import {UIState as UIStateType} from 'shared/actions/ui/UIState'
import {RegisterModel, getModel} from 'shared/Registry'
import {State} from 'typedux'

const {Record} = Immutable

export const RootStateRecord = Record({
	AppState: new AppStateType(),
	AuthState:new AuthStateType(),
	JobState:new JobStateType(),
	RepoState: new RepoStateType(),
	IssueState: new IssueStateType(),
	UIState: new UIStateType()
})

@RegisterModel
export class RootState extends RootStateRecord implements State {

	static fromJS(o:any) {
		let rootState = new RootState()
		StateLeafKeys
			.forEach(nextKey => {
				const model = getModel(nextKey)
				assert(model,'unknown key: ' + nextKey)

				const val = o[nextKey]
				if (val)
					rootState = (rootState.set(nextKey,model.fromJS(val))) as any
			})

		return rootState
	}

	constructor(o:any = {}) {
		super(o)
	}


	AppState:AppStateType
	AuthState:AuthStateType
	JobState:JobStateType
	RepoState:RepoStateType
	IssueState:IssueStateType
	UIState:UIStateType
}