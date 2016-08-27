import {BaseService, IServiceConstructor, RegisterService} from 'shared/services'
import ProcessType from 'shared/ProcessType'
import DatabaseClientService from './DatabaseClientService'
import {ObservableStore} from 'typedux'
import {ToastMessageType} from 'shared/models/Toast'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'

const log = getLogger(__filename)

@RegisterService(ProcessType.StateServer)
export class ToastService extends BaseService {

	private unsubscribe:Function
	private pendingTimers = {}

	private uiActions:UIActionFactory
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
		this.uiActions = Container.get(UIActionFactory)
		this.store = Container.get(ObservableStore as any) as any
		return super.init()
	}
	
	private clear() {
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}

		Object.keys(this.pendingTimers)
			.forEach(timerId => clearTimeout(this[timerId]))

		this.uiActions.clearMessages()
	}

	onMessagesChanged = (newMessages) => {

		newMessages.forEach(msg => {

			msg = _.toJS(msg)

			const
				clearMessage = () => {
					this.uiActions.removeMessage(msg.id)
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
			this.pendingTimers[msg.id] = setTimeout(clearMessage, isError ? 60000 : 5000)
		})
	}

	/**
	 * Start the toast manager
	 *
	 * @returns {Promise<BaseService>}
	 */
	async start() {
		this.unsubscribe = this.store.observe(
			[this.uiActions.leaf(), 'messages'],
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