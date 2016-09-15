

import {overrideDataTypeBackend} from "ui/components/data/DataManager"
import {AvailableRepo} from "shared/models"
import {RepoActionFactory} from "shared/actions/repo/RepoActionFactory"

// overrideDataTypeBackend(AvailableRepo,(...ids) => {
// 	return Container
// 		.get(RepoActionFactory)
// 		.getAvailableRepos(...ids)
// })