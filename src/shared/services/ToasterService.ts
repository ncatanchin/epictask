import {BaseService, IServiceConstructor, RegisterService} from 'shared/services'
import ProcessType from 'shared/ProcessType'
import DatabaseClientService from './DatabaseClientService'
import {ObservableStore} from 'typedux'
import {ToastMessageType} from 'shared/models'
import { getUIActions } from "shared/actions/ActionFactoryProvider"

const log = getLogger(__filename)

@RegisterService(ProcessType.UI)
export class ToastService extends BaseService {

	private unsubscribe:Function
	private pendingTimers = {}

	private store:ObservableStore<any>
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	
	init(): Promise<this> {
		this.store = Container.get(ObservableStore as any) as any
		return super.init()
	}
	
	private clear() {
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}

		Object
			.keys(this.pendingTimers)
			.forEach(timerId => clearTimeout(this[timerId]))

		getUIActions().clearMessages()
	}
	
	/**
	 * Handles changes triggered by observing
	 *
	 * @param newMessages
	 */
	onMessagesChanged = (newMessages) => {

		newMessages.forEach(msg => {

			msg = _.toJS(msg)

			const
				stopFloating = () => {
					msg.floatVisible = false
					getUIActions().updateMessage(msg)
					delete this.pendingTimers[msg.id]
				},
				isError = msg.type === ToastMessageType.Error


			// Don't add a remove timer for Error messages
			// if (msg.type === ToastMessageType.Error)
			// 	return

			if (this.pendingTimers[msg.id]) {
				log.debug(`Timer already exists for message: ${msg.id}`)
				return
			}

			// Add the remove timer
			this.pendingTimers[msg.id] = setTimeout(stopFloating, isError ? 60000 : 5000)
		})
	}

	/**
	 * Start the toast manager
	 *
	 * @returns {Promise<BaseService>}
	 */
	async start() {
		this.unsubscribe = this.store.observe(
			[getUIActions().leaf(), 'messages'],
			this.onMessagesChanged
		)

		if (module.hot)
			module.hot.dispose(() => this.clear())

		return super.start()
	}

	async stop() {
		this.clear()
		return super.stop()
	}


}


export default ToastService

if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}