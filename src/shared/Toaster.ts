

import * as uuid from 'node-uuid'
import {AutoWired,Inject,Singleton,Container} from 'typescript-ioc'

import {ToastMessageType, IToastMessage} from 'shared/models/Toast'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {absoluteFilename} from 'shared/util/Files'

const log = getLogger(__filename)
const fs = require('fs')
const path = require('path')


@AutoWired
@Singleton
export default class Toaster {

	@Inject
	appActions:AppActionFactory

	addMessage(message:IToastMessage|string,type:ToastMessageType = ToastMessageType.Info) {
		if (_.isString(message)) {
			message = {
				id: uuid.v4(),
				createdAt: Date.now(),
				type: type,
				content: message
			}
		}

		this.appActions.addMessage(message)
	}

	addErrorMessage(err:Error|string) {
		if (_.isString(err)) {
			err = new Error(err)
		}
		const payload = _.pick(err, 'message', 'code', 'stack', 'description') as any
		//logError(err)
		this.appActions.addErrorMessage(payload)
	}
}

const toaster = Container.get(Toaster)

/**
 * Report message to ui from anywhere
 *
 * @param message
 * @param type
 */
export function addMessage(message:IToastMessage|string,type:ToastMessageType = ToastMessageType.Info) {
	toaster.addMessage(message,type)
}


/**
 * Report an error to the UI from anywhere
 *
 * @param err
 */
export function addErrorMessage(err:Error|string) {
	toaster.addErrorMessage(err)
}



