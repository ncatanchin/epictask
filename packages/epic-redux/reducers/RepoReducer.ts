import {cloneObject} from 'shared/util'
const log = getLogger(__filename)

import {List} from 'immutable'
import {DefaultLeafReducer} from 'typedux'
import {RepoKey} from 'shared/Constants'
import {RepoState,RepoMessage} from './RepoState'

import {SyncStatus, ISyncDetails,Repo, AvailableRepo,Comment,Issue,Label} from 'shared/models'
import {Provided} from 'shared/util/ProxyProvided'

@Provided
export class RepoReducer extends DefaultLeafReducer<RepoState,RepoMessage> {

	constructor() {
		super(RepoKey,RepoState)
	}


	/**
	 *
	 * @returns {RepoState}
	 */
	defaultState(o = {}):any {
		return RepoState.fromJS(o)
	}

}