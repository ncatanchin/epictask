// import {StateLeafKeys} from "epic-global"
// import {AppState as AppStateType} from '../state/AppState'
// import {AuthState as AuthStateType} from "../state/AuthState"
// import {RepoState as RepoStateType} from "../state/RepoState"
// import {IssueState as IssueStateType} from "../state/IssueState"
// import {JobState as JobStateType} from "../state/JobState"
// import {UIState as UIStateType} from "../state/UIState"
// import {RegisterModel, getModel} from "epic-global"
// import {State} from 'typedux'
//
// const {Record} = Immutable
//
// export const RootStateRecord = Record({
// 	AppState: new AppStateType(),
// 	AuthState:new AuthStateType(),
// 	JobState:new JobStateType(),
// 	RepoState: new RepoStateType(),
// 	IssueState: new IssueStateType(),
// 	UIState: new UIStateType()
// })
//
// @RegisterModel
// export class RootState extends RootStateRecord implements State {
//
// 	static fromJS(o:any) {
// 		let rootState = new RootState()
// 		StateLeafKeys
// 			.forEach(nextKey => {
// 				const model = getModel(nextKey)
// 				assert(model,'unknown key: ' + nextKey)
//
// 				const val = o[nextKey]
// 				if (val)
// 					rootState = (rootState.set(nextKey,model.fromJS(val))) as any
// 			})
//
// 		return rootState
// 	}
//
// 	constructor(o:any = {}) {
// 		super(o)
// 	}
//
//
// 	AppState:AppStateType
// 	AuthState:AuthStateType
// 	JobState:JobStateType
// 	RepoState:RepoStateType
// 	IssueState:IssueStateType
// 	UIState:UIStateType
// }