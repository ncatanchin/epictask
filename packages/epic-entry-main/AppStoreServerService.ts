// import {Map} from 'immutable'
//
//
// import * as assert from 'assert'
// import {BaseService, RegisterService, IServiceConstructor} from "epic-services"
//
// import { ProcessType } from "epic-entry-shared/ProcessType"
// import { acceptHot } from "epic-global/HotUtils"
// import * as AppStoreServer from './AppStoreServer'
//
// const
// 	log = getLogger(__filename)
//
// // Singleton ref
// let
// 	appStoreServer:AppStoreServerService
//
//
// /**
//  * AppStoreServer Service for managing all operations
//  */
// @RegisterService(ProcessType.Main)
// export class AppStoreServerService extends BaseService {
//
// 	/**
// 	 * Get the instance
// 	 *
// 	 * @returns {AppStoreServerService}
// 	 */
// 	static getInstance() {
// 		if (!appStoreServer) {
// 			appStoreServer = new AppStoreServerService()
// 		}
//
// 		return appStoreServer
// 	}
//
// 	private killed = false
//
// 	/**
// 	 * Unsubscribe from store updates
// 	 */
// 	private unsubscriber:Function
//
// 	/**
// 	 * Dependencies
// 	 *
// 	 * @returns {Array}
// 	 */
// 	dependencies(): IServiceConstructor[] {
// 		return []
// 	}
//
// 	constructor() {
// 		super()
//
// 		assert(!appStoreServer,`AppStoreServer Manager can only be instantiated once`)
// 	}
//
//
//
// 	/**
// 	 * Init the service
// 	 * @returns {Promise<BaseService>}
// 	 */
// 	async init():Promise<any> {
// 		return super.init()
// 	}
//
// 	/**
// 	 * Start the AppStoreServer Service
// 	 *
// 	 * @returns {AppStoreServerService}
// 	 */
// 	async start():Promise<this> {
// 		const
// 			server = require("./AppStoreServer") as typeof AppStoreServer
//
// 		log.info(`Starting app store server`)
// 		await server.start()
//
// 		return super.start()
// 	}
//
//
//
// 	kill() {
// 		//assert(module.hot,'kill can only be called for hmr')
// 		this.killed = true
//
// 		if (this.unsubscriber)
// 			this.unsubscriber()
//
// 	}
//
// }
//
//
// /**
//  * Get the AppStoreServer singleton
//  *
//  * @return {AppStoreServerService}
//  */
// export function getAppStoreServer() {
// 	return AppStoreServerService.getInstance()
// }
//
// Container.bind(AppStoreServerService).provider({get: getAppStoreServer})
//
// export default getAppStoreServer
//
//
// /**
//  * HMR
//  */
// acceptHot(module,log)
//
//
