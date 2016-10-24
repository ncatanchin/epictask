

import {overrideDataTypeBackend} from "epic-ui-components"
import {AvailableRepo} from "epic-models"
import {RepoActionFactory} from "epic-typedux"

// overrideDataTypeBackend(AvailableRepo,(...ids) => {
// 	return Container
// 		.get(RepoActionFactory)
// 		.getAvailableRepos(...ids)
// })