import {Container} from 'typescript-ioc'
import {BaseService} from './IService'
import {ObservableStore} from 'typedux'
import {ToastMessageType} from 'shared/models/Toast'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'

const log = getLogger(__filename)


export class ToastService extends BaseService {

	private unsubscribe:Function
	private pendingTimers = {}

	uiActions:UIActionFactory = Container.get(UIActionFactory)
	store:ObservableStore<any> = Container.get(ObservableStore as any) as any


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


			// Dont add a remove timer for Error messages
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