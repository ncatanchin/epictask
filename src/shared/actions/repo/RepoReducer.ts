import {cloneObject} from 'shared/util/ObjectUtil'
const log = getLogger(__filename)

import {List} from 'immutable'
import {DefaultLeafReducer} from 'typedux'
import {RepoKey} from "Constants"
import {RepoState,RepoMessage} from './RepoState'

import {SyncStatus, ISyncDetails,Repo, AvailableRepo,Comment,Issue,Label} from 'shared/models'


export class RepoReducer extends DefaultLeafReducer<RepoState,RepoMessage> {

	constructor() {
		super(RepoKey,RepoState)
	}


	/**
	 *
	 * @returns {RepoState}
	 */
	defaultState():any {
		return new RepoState()
	}

}