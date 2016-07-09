import {Singleton, AutoWired,Inject, Container, Scope} from 'typescript-ioc'
import {IService, ServiceStatus, BaseService} from './IService'
import {ObservableStore} from 'typedux'
import {Stores} from './DBService'
import {ToastMessageType} from 'shared/models/Toast'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'

const log = getLogger(__filename)

@AutoWired
@Singleton
export default class ToastService extends BaseService {


	pendingTimers = {}

	@Inject
	uiActions:UIActionFactory

	@Inject
	store:ObservableStore<any>

	onMessagesChanged = (newMessages) => {

		newMessages.forEach(msg => {

			msg = _.toJS(msg)

			const
				clearMessage = () => this.uiActions.removeMessage(msg.id),
				isError = msg.type === ToastMessageType.Error


			// Dont add a remove timer for Error messages
			// if (msg.type === ToastMessageType.Error)
			// 	return

			if (this.pendingTimers[msg.id]) {
				log.debug(`Timer already exists for message: ${msg.id}`)
				return
			}

			// Add the remove timer
			this.pendingTimers[msg.id] = setTimeout(clearMessage, isError ? 20000 : 5000)
		})
	}

	async start() {
		await super.start()
		this.store.observe(
			[this.uiActions.leaf(), 'messages'],
			this.onMessagesChanged
		)

		setupHMR(this)
		return this
	}


	status():ServiceStatus {
		return this._status
	}



	destroy():this {
		return this
	}
}




function setupHMR(service:ToastService) {
	if (module.hot) {
		module.hot.dispose(() => {
			log.info(`HMR - disposing toast timers/messages`)
			Object.keys(service.pendingTimers)
				.forEach(msgId => {
					clearTimeout(service.pendingTimers[msgId])
					delete service.pendingTimers[msgId]

					service.uiActions.clearMessages()
				})
		})
	}
}
