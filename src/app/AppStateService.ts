import {getStore} from './store'
import {AppActionFactory} from './AppActionFactory'
import {createClient} from 'shared/GitHubClient'

const log = getLogger(__filename)
const store = getStore()
const appActions = new AppActionFactory()

let stateType = null

async function updateStateType() {
	const newStateType = appActions.state.stateType
	if (newStateType === stateType)
		return

	log.info('AppState Updated!!', newStateType)
	stateType = newStateType

	if (stateType === AppStateType.VerifyLogin) {
		const client = createClient()
		const user = await client.user()

		log.info(`Verified user as`,user)
		if (!user || !user.login) {
			throw new Error('Invalid user token')
		}
	}
}

updateStateType()

let observer = store.observe(appActions.leaf(),() => {
	updateStateType()
})
//
// if (module.hot) {
// 	module.hot.accept()
// 	module.hot.dispose(() => {
// 		if (observer) {
// 			observer()
// 			observer = null
// 		}
// 	})
// }
