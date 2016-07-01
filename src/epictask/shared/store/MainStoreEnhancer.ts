import {getAction} from 'typedux'

const diff = require('immutablediff')
import {Events} from 'shared/Constants'
import {transformValues} from 'shared/util/ObjectUtil'


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

		event.returnValue = transformValues(store.getState().toJS(),
			(key,val) => (val.toJS) ? val.toJS() : val)
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
		const action = getAction(leaf,name)
		if (!action)
			throw new Error(`Could not find action ${leaf}:${name} on main process`)

		log.info(`Executing action on main: ${leaf}:${name}`)
		action(...args)
	}

	addIpcListener(Events.StoreGetMainState,getMainState)

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

function broadcastActionAndStateToClients(action,newState) {
	if (!newState || !action)
		return

	if (newState === lastSentState)
		return



	function getStatePatch() {



		// First check the last state we sent
		lastSentState = lastSentState || Immutable.Map()

		// Create a patch
		statePatch = _.cloneDeep(diff(lastSentState,newState).toJS())
		lastSentState = newState

		//log.info('Sending state patch', JSON.stringify(statePatch,null,4))
		return statePatch
		// if (newState.toJS)
		// 	newState = newState.toJS()
		//
		// newState = transformValues(newState,
		// 	(key,val) => (val.toJS) ? val.toJS() : val)
	}

	let statePatch = getStatePatch()

	Object.keys(clients)
		.map(key => ({
			webContentsId:key,
			client:clients[key]
		}))
		.filter(({client}) => client.active)
		.forEach(({webContentsId,client}) => {
			const {webContents} = client
			try {
				if (webContents.isCrashed() || webContents.isDestroyed()) {
					unregisterRenderer(webContentsId)
					return
				}

				webContents.send(Events.StoreMainStateChanged, {action, patch: statePatch})
			} catch (err) {
				log.error('Failed to send message to renderer, probably destroyed, removing',err)
				unregisterRenderer(webContentsId)
			}
		})
}

/**
 * Main enhancer => post dispatch simply forwards action
 * + new state to renderers/clients
 *
 * @param storeCreator
 * @returns {(reducer:any, initialState:any)=>undefined}
 */
export default function mainStoreEnhancer(storeCreator) {

		return (reducer, initialState) => {
			let store = storeCreator(reducer, initialState)

			attachEvents(store)

			const storeDotDispatch = store.dispatch

			store.dispatch = (action) => {
				const state = store.getState()
				storeDotDispatch(action)
				const newState = store.getState()

				if (state === newState)
					return


					broadcastActionAndStateToClients(action,newState)

			}

			return store
		}

}


if (module.hot) {
	module.hot.dispose(() => {
		log.info('disposing')
		ipcListeners.forEach(([channel,listener]) => {
			ipcMain.removeListener(channel,listener)
		})
	})
}