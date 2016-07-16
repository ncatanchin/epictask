import {getAction,ActionFactory} from 'typedux'

import {Container} from 'typescript-ioc'
import {Events} from '../Constants'
import {transformValues} from '../util/ObjectUtil'
const {nextTick} = process



const log = getLogger(__filename)

const clients = {}
const windowMap = {}
const ipcListeners = []

const addIpcListener = (channel:string,listener) => {
	ipcMain.on(channel,listener)
	ipcListeners.push([channel,listener])
}

const electron = require('electron')

const {ipcMain,BrowserWindow} = electron


function unregisterRenderer(webContentsId) {
	if (!Env.isDev)
		clients[webContentsId].active = false
}

function attachEvents(store) {


	/**
	 * Retrieves the current state from the main
	 * process and returns sync via ipc
	 *
	 * @param event
	 */
	function getMainState(event) {
		log.info('Getting state for renderer')

		const mainState = store.getState()
		const mainStateJS = mainState.toJS()

		const finalMainStateJS = transformValues(mainStateJS,
			(key,val) => (val.toJS) ? val.toJS() : val)
		event.returnValue = finalMainStateJS
	}


	/**
	 * Renderer dispatch
	 *
	 * @param event
	 * @param leaf
	 * @param name
	 * @param args
	 */
	function rendererDispatch(event,leaf,name,args) {
		const actionReg = getAction(leaf,name)
		if (!actionReg)
			throw new Error(`Could not find action ${leaf}:${name} on main process`)

		log.info(`Executing action on main: ${leaf}:${name}`)
		nextTick(() => {
			if (actionReg.options.isReducer) {
				const actions:ActionFactory<any,any> = Container.get(actionReg.actionFactory) as any
				const msg = actions.newMessage(leaf,actionReg.type,[],args,{source:{
					isReducer:true,
					fromRenderer:true
				}})
				store.dispatch(msg)
			} else {
				actionReg.action((factory) => {
					return Container.get(factory)
				}, ...args)
			}
		})

	}

	// List for main state requests
	addIpcListener(Events.StoreGetMainState,getMainState)

	//
	addIpcListener(Events.StoreRendererDispatch,rendererDispatch)

	addIpcListener(Events.StoreRendererRegister, (event, { filter, clientId }) => {
		const { sender } = event

		const
			webContentsId = sender.id,
			browserWindow = BrowserWindow.fromWebContents(sender)

		clients[webContentsId] = {
			webContents: sender,
			filter,
			clientId,
			windowId: browserWindow.id,
			active: true
		}

		if (windowMap[browserWindow.id] !== undefined) {
			unregisterRenderer(windowMap[browserWindow.id])
		}
		windowMap[browserWindow.id] = webContentsId

		// WebContents aren't automatically destroyed on window close
		// browserWindow.on('closed', () => unregisterRenderer(webContentsId))

		event.returnValue = true
	});
}


/**
 * Broadcasts action and resulting state to
 * clients / browserWindows'
 *
 * @param action
 * @param newState
 */
let lastSentState = null
let actionId = 0

function broadcastActionSender(action) {
	return ({webContentsId,client}) => {
		const {webContents} = client
		try {
			if (webContents.isDestroyed() || webContents.isCrashed()) {
				unregisterRenderer(webContentsId)
				return
			}

			webContents.send(Events.StoreMainStateChanged, {action, actionId})
		} catch (err) {
			log.error('Failed to send message to renderer, probably destroyed, removing',err)
			unregisterRenderer(webContentsId)
		}
	}
}

function broadcastActionAndStateToClients(action,newState) {
	if (!newState || !action ||
		newState === lastSentState ||
		(action.source && action.source.isReducer && action.source.fromRenderer))
		return


	// function getStatePatch() {
	// 	// First check the last state we sent
	// 	lastSentState = lastSentState || Immutable.Map()
	//
	// 	// Create a patch
	// 	statePatch = _.cloneDeep(diff(lastSentState,newState).toJS())
	// 	lastSentState = newState
	//
	// 	return statePatch
	//
	// }

	//let statePatch = getStatePatch()
	actionId++
	Object.keys(clients)
		.map(key => ({
			webContentsId:key,
			client:clients[key]
		}))
		.filter(({client}) => client.active)
		.forEach(broadcastActionSender(action))
}

/**
 * Main enhancer => post dispatch simply forwards action
 * + new state to renderers/clients
 *
 * @param storeCreator
 * @returns {(reducer:any, initialState:any)=>undefined}
 */
function mainStoreEnhancer(storeCreator) {

		return (reducer, initialState) => {
			let store = storeCreator(reducer, initialState)

			attachEvents(store)

			const storeDotDispatch = store.dispatch

			store.dispatch = (action) => {
				const state = store.getState()
				storeDotDispatch(action)
				const newState = store.getState()

				// If the state changed then send the action
				if (state !== newState) {
					nextTick(() => broadcastActionAndStateToClients(action,newState))
				}

			}

			return store
		}

}

// HMR setup
if (module.hot) {
	module.hot.dispose(() => {
		log.info('disposing')
		ipcListeners.forEach(([channel,listener]) => {
			ipcMain.removeListener(channel,listener)
		})
	})
}

export default mainStoreEnhancer