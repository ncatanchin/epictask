import {getAction,ActionFactory} from 'typedux'
import {Container} from 'typescript-ioc'
import * as Server from './ServerEntry'

const log = getLogger(__filename)

/**
 * Make render dispatch handler
 *
 * The architecture is implemented so that
 * every node processes it's own reducer actions,
 *
 * but actual actions are handled on the action worker
 *
 * @param store
 * @returns {(clientId:string, leaf:string, name:string, args:any[])=>void}
 */
function makeClientDispatchHandler(store) {
	
	return (clientId:string,leaf:string,name:string,args:any[]) => {
		const actionReg = getAction(leaf,name)
		if (!actionReg)
			throw new Error(`Could not find action ${leaf}:${name} on main process`)
		
		log.info(`Executing action on main: ${leaf}:${name}`)
		
		// On the next tick
		setImmediate(() => {
			
			// If its a reducer message then just dispatch
			if (actionReg.options.isReducer) {
				const actions:ActionFactory<any,any> = Container.get(actionReg.actionFactory) as any
				
				// Create duplicated message
				const msg = actions.newMessage(leaf,actionReg.type,[],args,{
					source:{
						clientId,
						isReducer:true,
						fromRenderer:true
					}})
				
				// dispatch
				store.dispatch(msg)
			}
			
			// Otherwise - create a new action and execute
			else {
				actionReg.action((factory) => {
					return Container.get(factory)
				}, ...args)
			}
		})
		
	}
}

/**
 * Broadcasts action and resulting state to
 * clients / browserWindows'
 *
 * @param action
 * @param newState
 */
let lastSentState = null

/**
 * Broadcast an action to all connected clients
 *
 * @param action
 * @param newState
 */
function broadcastActionAndStateToClients(action,newState) {
	if (!newState || !action || newState === lastSentState)
		return
	
	Server.broadcastAction(action)
	
}

/**
 * Main enhancer => post dispatch simply forwards action
 * + new state to renderers/clients
 *
 * @param storeCreator
 * @returns {(reducer:any, initialState:any)=>undefined}
 */
function serverStoreEnhancer(storeCreator) {

		return (reducer, initialState) => {
			let store = storeCreator(reducer, initialState)

			// Create dispatcher for client actions
			const dispatchListener = makeClientDispatchHandler(store)
			Server.addActionListener(dispatchListener)
			
			if (module.hot)
				module.hot.dispose(() => Server.removeActionListener(dispatchListener))

			// Get ref to store.dispatch
			const storeDotDispatch = store.dispatch

			// Dispatch interceptor
			store.dispatch = (action) => {
				
				// Get the current state
				const state = store.getState()
				
				// Dispatch the action
				storeDotDispatch(action)
				
				// Get the new state
				const newState = store.getState()

				// If the state changed then send the action
				if (state !== newState) {
					setImmediate(() => broadcastActionAndStateToClients(action,newState))
				}

			}

			return store
		}

}

export default serverStoreEnhancer