import getLogger from "common/log/Logger"
import {StoreEnhancerStoreCreator} from "redux"
import {AppStoreSyncKeys, ISyncActionMessage} from "common/store/AppStoreTypes"
import {ActionMessageFilter, IActionMessageHandler} from "common/store/enhancers/ActionMessageFilter"
import {ActionMessage} from "typedux"
import {toPlainObject} from "typetransform"
import {cloneObjectShallow} from "common/ObjectUtil"
import {getWindowId} from "common/ElectronUtil"
import {getProcessTypeName} from "common/Process"
import EventHub from "common/events/Event"
import {getValue} from "typeguard"
import * as _ from 'lodash'

const
  log = getLogger(__filename),
  id = `${getProcessTypeName()}-${process.pid}`,
  {nextTick} = process

export const sendStoreAction:((handler:IActionMessageHandler<any, any>) => IActionMessageHandler<any, any>) = ActionMessageFilter((action:ActionMessage<any>) => {
  action = Object.assign(_.clone(action), {
    windowId: getWindowId(),
    fromChildId: id,
    stateType: null
  })

  EventHub.emit("ChildStoreAction", action as ISyncActionMessage)
})

/**
 * Push actions to the store
 *
 * @param actions
 */
function pushStoreAction(...actions):void {
  const store = getValue(() => getReduxStore())

  actions.forEach(action => store.dispatch(action))
}

/**
 * Main enhancer => post dispatch simply forwards action
 * + new state to renderers/clients
 *
 * @param storeCreator
 * @returns {(reducer:any, initialState:any)=>undefined}
 */
function appStoreEnhancer(storeCreator):StoreEnhancerStoreCreator {
  return (reducer:any, initialState:any) => {
    const
      store = storeCreator(reducer, initialState),
      storeDotDispatch = store.dispatch

    EventHub.on("ServerStoreAction", action => {
      const
        {fromChildId, fromWindowId, windowId} = action,
        ids = [fromChildId, fromWindowId, windowId],
        isNewAction = !ids.includes(id) && !ids.includes(getWindowId())

      if (!isNewAction) {
        log.debug(`I sent this so no need to dispatch again`)
        return
      }

      pushStoreAction(action)
    })

    // OVERRIDE DISPATCH - CHECK STATE AFTER ACTION
    store.dispatch = (action) => {
      const
        {fromServer, fromChildId} = action,
        state = store.getState()

      if (fromChildId === id)
        return

      nextTick(() => {
        storeDotDispatch(action)

        const
          newState = store.getState()

        // IF CHANGED - SEND TO CHILDREN
        if (AppStoreSyncKeys.includes(action.leaf) && !fromServer && state !== newState) {

          // If it's a reducer then process it, otherwise - wait for server
          // to process the action and send data
          nextTick(() => sendStoreAction(action))

        }
      })


    }
    return store
  }
}

export default appStoreEnhancer
