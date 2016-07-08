import {Singleton, AutoWired,Inject, Container, Scope} from 'typescript-ioc'
import {IService, ServiceStatus} from './IService'
import {ObservableStore} from 'typedux'
import {Stores} from './DBService'
import {ToastMessageType} from 'shared/models/Toast'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'

const log = getLogger(__filename)

@AutoWired
@Singleton
export default class ToastService implements IService {

	private _status = ServiceStatus.Created
	pendingTimers = {}

	@Inject
	uiActions:UIActionFactory

	@Inject
	store:ObservableStore<any>

	onMessagesChanged = (newMessages) => {

		_.toJS(newMessages).forEach(msg => {

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
		this._status = ServiceStatus.Started
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

	async init():Promise<this> {
		this._status = ServiceStatus.Initialized
		return this
	}

	async stop():Promise<this> {
		this._status = ServiceStatus.Stopped
		return this
	}

	destroy():this {
		return this
	}
}




function setupHMR(service) {
	if (module.hot) {
		module.hot.dispose(() => {
			log.info(`HMR - disposing toast timers/messages`)
			Object.keys(service.pendingTimers)
				.forEach(msgId => {
					clearTimeout(service.pendingTimers[msgId])
					delete service.pendingTimers[msgId]

					service.appActions.clearMessages()
				})
		})
	}
}
