

import * as uuid from 'node-uuid'

import {ToastMessageType, IToastMessage} from 'shared/models/Toast'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'


const
	log = getLogger(__filename)


/**
 * Toaster functions for use globally
 */
export class Toaster {

	get uiActions():UIActionFactory {
		return Container.get(require('shared/actions/ui/UIActionFactory').default as typeof UIActionFactory)
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
	
	addSuccessMessage(message:IToastMessage|string) {
		this.addMessage(message,ToastMessageType.Success)
	}

	addErrorMessage(err:Error|string) {
		if (_.isString(err)) {
			err = new Error(err)
		}
		const payload = _.pick(err, 'message', 'code', 'stack', 'description') as any
		//logError(err)
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
	Container.get(UIActionFactory).clearMessages()
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

/**
 * Report an error to the UI from anywhere
 *
 * @param err
 */
export function addErrorMessage(err:Error|string) {
	getToaster().addErrorMessage(err)
}


export default Toaster
