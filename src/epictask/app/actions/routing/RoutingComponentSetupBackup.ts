// import {Router,IndexRedirect,Route,hashHistory} from 'react-router'
// import {ReposPage} from './repos'
// import {LoginPage} from './auth'
// import {syncHistoryWithStore} from 'react-router-redux'
//
// // Get the pieces
// import {MuiThemeProvider} from "material-ui/styles"
// import {RootContainerComponent,HeaderComponent,AppBody} from './components'
// import {getStore} from './store/AppStore'
// import {AppActionFactory} from './AppActionFactory'
// import {getPage} from './Pages'
// import {AppState} from './AppState'
//
// const log = getLogger(__filename)
//
// // Build the container
// log.info('BootStrapping')
//
// const store = getStore()
//
//
// const appActions = new AppActionFactory()
//
// // Sync the history
// //const appHistory = useRouterHistory(createHashHistory)({queryKey:false})
// //const history = hashHistory
// // const history = syncHistoryWithStore(hashHistory, store.getReduxStore(),{
// // 	selectLocationState: (state) => {
// // 		const routingState = state.get('routing')
// // 		const routingStateJs = (routingState) ? routingState.toJS() : null
// // 		//log.info('Location state', state,JSON.stringify(routingStateJs,null,4))
// // 		return routingStateJs
// // 	}
// // })
