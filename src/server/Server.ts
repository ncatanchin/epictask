import {EventEmitter} from "events"

import {getStoreState} from "shared/store"
import {transformValues} from "shared/util"
import {IStateServerResponse} from "shared/actions/ServerClient"
import storeBuilder from 'shared/store/AppStoreBuilder'

import {DatabaseService as DatabaseServiceType} from '../services/DatabaseService'

const
	log = getLogger(__filename),
	actionEmitter = new EventEmitter(),
	ipc = require('node-ipc')

ipc.config.id = 'StateServer'
ipc.config.retry = 1500

/**
 * IPC mesage handlers
 *
 * @type {{getState: (()=>any)}}
 */
const handlers = {
	getState() {
		log.info('Getting state for renderer')
		
		const
			mainState = getStoreState(),
			mainStateJS = mainState.toJS()
		
		return transformValues(
			mainStateJS,
			(key, val) => (val.toJS) ? val.toJS() : val
		)
	}
}


/**
 * Sent a request response
 *
 * @param id of the request
 * @param type of the request
 * @param socket the originating socket
 * @param result the result - null if error
 * @param error if error occurred then error
 */
function emitResponse(id,type,socket,result,error = null) {
	ipc.server.emit(socket, 'response', {
		id,
		type,
		result,
		error
	} as IStateServerResponse)
}


/**
 *
 * @param action
 */
export async function broadcastAction(action) {
	ipc.server.broadcast('action',action)
}

/**
 * Start the server and register handlers, etc
 */
export async function start() {
	
	// First create the store
	await storeBuilder(require('./ServerStoreEnhancer').default)
	
	// Then start the ipc server
	ipc.server(() => {
		ipc.server.on('request',(request,socket) => {
			const
				{id, clientId,type} = request,
				handler = handlers[type]
			
			log.info(`Request received from ${clientId}`)
			
			if (!handler)
				return emitResponse(id,type,socket,null,new Error(`Unknown request type: ${request.type}`))
			
			
			try {
				const result = handler(request)
				
				emitResponse(id,type,socket,result)
				
			} catch (err) {
				emitResponse(id,type,socket,null,err)
			}
		})
		
		ipc.server.on('action',({clientId,leaf,name,args},socket) => {
			actionEmitter.emit('action',clientId,leaf,name,args)
		})
	})
}


/**
 * Action listener signature
 */
export type TServerActionListener = (clientId:string,leaf:string,name:string,args:any[]) => void

/**
 * Add an action listener
 *
 * @param listener
 */
export function addActionListener(listener:TServerActionListener) {
	actionEmitter.addListener('action',listener)
}


/**
 * Remove action listener
 */
export function removeActionListener(listener:TServerActionListener) {
	actionEmitter.removeListener('action',listener)
}
