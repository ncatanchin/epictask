import {ActionFactory,Action,ActionMessage} from 'typedux'
import {AppStateType} from 'shared/AppStateType'
import {AppKey, Dialogs, RepoKey,RepoTransientProps} from "shared/Constants"
import {IToastMessage} from 'shared/models/Toast'
import {ISettings} from 'shared/Settings'
import {Issue} from 'shared/models/Issue'
import {AppState} from './AppState'
import {User} from 'shared/models/User'
import {cloneObject} from 'shared/util'


const log = getLogger(__filename)

function updateIssueTransients(issue,availableRepos) {

	const
		{repoId} = issue,
		availRepo = availableRepos.find(availRepo => availRepo.repoId === repoId)

	assert.ok(availRepo,'Unable to find repo with id: ' + repoId)

	// Assign all transient props
	Object.assign(issue,_.pick(availRepo.repo,RepoTransientProps))
}

export class AppActionFactory extends ActionFactory<any,ActionMessage<typeof AppState>> {

	constructor() {
		super(AppState)
	}

	leaf():string {
		return AppKey;
	}

	@Action()
	setTheme(theme:any) {}

	@Action()
	setReady(ready:boolean) {}

	@Action()
	setDialogOpen(name:string,open:boolean) {}

	@Action()
	setEditingIssue(issue:Issue) {}

	@Action()
	updateEditingIssue(props:any) {
		return async (dispatch,getState) => {
			const issue = this.state.editingIssue
			if (!issue) return

			const
				{RepoActionFactory} = require('./repo/RepoActionFactory'),
				{availableRepos} = getState().get(RepoKey)

			const updatedIssue = await RepoActionFactory
				.fillIssue(
					Object.assign(cloneObject(issue),props),
					availableRepos
				)

			this.setEditingIssue(updatedIssue)
		}
	}

	@Action()
	newIssue() {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				dialogName = Dialogs.IssueEditDialog


			if (actions.state.dialogs[dialogName]) {
				log.info('Dialog is already open',dialogName)
				return
			}

			const {availableRepos,selectedIssues} = getState().get(RepoKey)
			const repoId = (selectedIssues && selectedIssues.size) ?
				selectedIssues.get(0).repoId :
					(availableRepos && availableRepos.size) ?
						availableRepos.get(0).repoId :
							null

			if (!repoId) {
				actions.addErrorMessage(new Error('You need to add some repos before you can create an issue. duh...'))
				return
			}

			const {RepoActionFactory} = require('./repo/RepoActionFactory')
			const issue = await RepoActionFactory.fillIssue(new Issue({repoId}),availableRepos)

			actions.setEditingIssue(issue)
			actions.setDialogOpen(dialogName,true)
		}
	}

	@Action()
	editIssue(issue:Issue = null) {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				dialogName = Dialogs.IssueEditDialog


			const repoState = getState().get(RepoKey),
				{availableRepos} = repoState,
				{RepoActionFactory} = require('./repo/RepoActionFactory')


			issue = issue || repoState.selectedIssue
			assert(issue,'You must have an issue selected in order to edit one ;)')

			issue = await RepoActionFactory.fillIssue(issue,availableRepos)

			actions.setEditingIssue(issue)
			actions.setDialogOpen(dialogName,true)
		}
	}



	@Action()
	updateSettings(newSettings:ISettings) {}

	@Action()
	setStateType(stateType:AppStateType) {}

	@Action()
	setError(err:Error) {}

	@Action()
	addMessage(message:IToastMessage) {}

	@Action()
	addErrorMessage(err:Error|string) {}

	@Action()
	removeMessage(id:string) {}

	@Action()
	setMonitorState(monitorState:any) {}

	@Action()
	setUser(user:User) {}

}
