
import { Stores } from "epic-database-client"
import { PouchDBRepo } from "typestore-plugin-pouchdb"
import { setDataOnHotDispose, getHot } from "epic-global/HotUtils"
import { getValue } from "epic-global/ObjectUtil"
import { AppEventType } from "epic-global/Constants"

import {Map} from 'immutable'

const
	log = getLogger(__filename),
	changeSubscriptions = getHot(module,'changeSubscriptions',Map<string,any>()),
	pendingChanges = []


let
	getPouchDB

setDataOnHotDispose(module,() => ({
	changeSubscriptions
}))

/**
 * Cancel any existing subscriptions for a model type
 *
 * @param modelType
 */
function cancelCurrentSubscription(modelType:string) {
	if (changeSubscriptions[modelType]) {
		log.debug(`Unsubscribing: ${modelType}`)
		try {
			changeSubscriptions[modelType].cancel()
		} catch (err) {
			log.error(`Failed to unsubscribe: ${modelType}`,err)
		}
		changeSubscriptions[modelType] = null
	}
}




/**
 * Broadcast pending changes to all clients
 */
const broadcast = _.throttle(() => {
	try {
		const
			changeCount = Math.min(300,pendingChanges.length),
			changes = pendingChanges.slice(0,changeCount)
		
		EventHub.emit(AppEventType.DatabaseChanges,[...pendingChanges])
		
		// CLEAR THE LIST IF IT SUCCEEDED
		pendingChanges.splice(0,changeCount)
		
		if (pendingChanges.length)
			broadcast()
		
	} catch (err) {
		log.error(`Failed to broadcast db changes`,err)
	}
},500)

/**
 * Add a pending change to the queue and trigger
 * the throttled distribution
 *
 * @param change
 */
function pushChange(change:IDatabaseChange) {
	pendingChanges.push(change)
	broadcast()
}

/**
 * Subscribe to the changes feed in pouchdb
 */
export function watchChanges(
	stores:Stores,
	inGetPouchDB:Function
) {
	
	getPouchDB = inGetPouchDB
	
	const
		pouchStores = Object.values(stores)
			.filter(store => getValue(() => getPouchDB(store) || (<any>store).pouchDB))
	
	pouchStores
		.forEach((store:PouchDBRepo<any>) => {
			
			const
				modelType = store.modelType.name
			
			cancelCurrentSubscription(modelType)
			
			log.info(`Subscribing ${modelType}`)
			
			const
				db = (store as any).pouchDB || store.getPouchDB(),
				changes = changeSubscriptions[modelType] = db.changes({
					live: true,
					since: 'now',
					include_docs: true
				})
			
			/**
			 * On change queue batch updates for broadcast
			 */
			changes.on('change',(info) => {
				log.debug(`Change received for type: ${modelType}`,info)
				try {
					const
						doc = info.doc || {},
						model = doc && doc.type === modelType && store.getModelFromObject(doc),
						change:IDatabaseChange = doc && {
								id: info.id,
								rev: getValue(() => info.doc._rev),
								deleted: getValue(() => info.doc._deleted,false),
								doc,
								clazz: store.modelClazz as any,
								type: modelType,
								model,
								from: `${ProcessConfig.getTypeName()}-${getWindowId()}`
							}
					
					if (!model) {
						log.debug(`No model on update`,info)
						return
					}
					
					log.debug(`Broadcasting change`,change)
					
					pushChange(change)
					
				} catch (err) {
					log.error(`Failed to broadcast changes`,info,err)
				}
			})
			
			changes.on('error',err => {
				log.error(`An error occurred while listening for changes to ${modelType}`,err)
			})
			
		})
}
