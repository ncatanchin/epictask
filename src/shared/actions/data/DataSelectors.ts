
import {Map} from 'immutable'
import {DataState} from 'shared/actions/data/DataState'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {DataKey} from 'shared/Constants'
import {Repo} from 'shared/models/Repo'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {Issue} from 'shared/models/Issue'
import {Comment} from 'shared/models/Comment'
import {createStructuredSelector} from 'reselect'
import {Activity} from 'shared/models/Activity'



export const dataStateSelector = _.memoize(
	(state):DataState => state.get(DataKey)
)

export const activityModelsSelector = _.memoize(
	(state):Map<string,Activity> => dataStateSelector(state).models
		.get(Activity.$$clazz)  || Map<string,Activity>()
)

export const availRepoModelsSelector = _.memoize(
	(state):Map<string,AvailableRepo> => dataStateSelector(state).models.get(AvailableRepo.$$clazz)  || Map<string,AvailableRepo>()
)

export const repoModelsSelector = _.memoize(
	(state):Map<string,Repo> => dataStateSelector(state).models.get(Repo.$$clazz)  || Map<string,Repo>()
)

export const milestoneModelsSelector = _.memoize(
	(state):Map<string,Milestone> => dataStateSelector(state).models.get(Milestone.$$clazz)  || Map<string,Milestone>()
)

export const labelModelsSelector = _.memoize(
	(state):Map<string,Label> => dataStateSelector(state).models.get(Label.$$clazz)  || Map<string,Label>()
)

export const issueModelsSelector = _.memoize(
	(state):Map<string,Issue> => dataStateSelector(state).models.get(Issue.$$clazz)  || Map<string,Issue>()
)

export const commentModelsSelector = _.memoize(
	(state):Map<string,Comment> => dataStateSelector(state).models.get(Comment.$$clazz)  || Map<string,Comment>()
)

export const modelsSelector = createStructuredSelector({
	availRepos: availRepoModelsSelector,
	repoModels:repoModelsSelector,
	milestoneModels:milestoneModelsSelector,
	labelModels:labelModelsSelector,
	issueModels:issueModelsSelector,

})