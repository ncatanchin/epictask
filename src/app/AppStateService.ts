import {getStore} from './store'
import {AppActionFactory} from './AppActionFactory'
import {AuthActionFactory} from './auth/AuthActionFactory'


const log = getLogger(__filename)
const store = getStore()
const appActions = new AppActionFactory()
const authActions = new AuthActionFactory()

let stateType = null

async function updateStateType() {
	const newStateType = appActions.state.stateType
	if (newStateType === stateType)
		return

	log.info('AppState Updated!!', newStateType)
	stateType = newStateType

	if (stateType === AppStateType.VerifyLogin) {
		authActions.verify()
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
