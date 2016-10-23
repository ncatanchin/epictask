

import * as uuid from 'node-uuid'

import {ToastMessageType, IToastMessage} from 'shared/models/Toast'
import { getUIActions } from  "shared/actions/ActionFactoryProvider"
import { isString } from "shared/util"


const
	log = getLogger(__filename)


/**
 * Toaster functions for use globally
 */
export class Toaster {

	get uiActions() {
		return getUIActions()
	}

	addMessage(message:IToastMessage|string,type:ToastMessageType = ToastMessageType.Info) {
		if (_.isString(message)) {
			message = {
				id: uuid.v4(),
				createdAt: Date.now(),
				type: type,
				content: message,
				floatVisible: true
			}
		} else {
			message.type = type
		}
		this.uiActions.addMessage(message)
	}
	
	addDebugMessage(message:IToastMessage|string) {
		this.addMessage(message,ToastMessageType.Debug)
	}
	
	addInfoMessage(message:IToastMessage|string) {
		this.addMessage(message,ToastMessageType.Info)
	}
	
	addSuccessMessage(message:IToastMessage|string) {
		this.addMessage(message,ToastMessageType.Success)
	}

	addErrorMessage(err:Error|string) {
		if (isString(err)) {
			err = new Error(err)
		}
		const
			payload = _.pick(err, 'message', 'code', 'stack', 'description') as any
		
		this.uiActions.addErrorMessage(payload)
	}
}

let toaster:Toaster = null

/**
 * get the current toaster
 *
 * @returns {Toaster}
 */
export function getToaster() {
	if (!toaster)
		toaster = new Toaster()
	
	return toaster
}

/**
 * Bind singleton accessor to the container
 */
Container.bind(Toaster).provider({get: getToaster})


export function clearMessages() {
	this.uiActions.clearMessages()
}

/**
 * Report message to ui from anywhere
 *
 * @param message
 * @param type
 */
export function addMessage(message:IToastMessage|string,type:ToastMessageType = ToastMessageType.Info) {
	getToaster().addMessage(message,type)
}

export function addSuccessMessage(message:IToastMessage|string) {
	getToaster().addSuccessMessage(message)
}

export function addDebugMessage(message:IToastMessage|string) {
	getToaster().addDebugMessage(message)
}

export function addInfoMessage(message:IToastMessage|string) {
	getToaster().addInfoMessage(message)
}


/**
 * Report an error to the UI from anywhere
 *
 * @param err
 */
export function addErrorMessage(err:Error|string) {
	getToaster().addErrorMessage(err)
}


export default Toaster
