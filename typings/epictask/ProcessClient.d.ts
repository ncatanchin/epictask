declare namespace ProcessClient {
	
	/**
	 * Worker Message handler shape
	 */
	type TProcessMessageHandler = (workerEntry, messageType:string, data?:any) => void
	
	/**
	 * Raw process message handler
	 */
	type TMessageHandler = (messageType:string, data?:any) => void
	
	/**
	 * Get all the current message handlers
	 *
	 * @returns {{}}
	 */
	function getMessageHandlers()
	
	/**
	 * Get a specific message handler
	 *
	 * @param type
	 * @param args
	 * @returns {any}
	 */
	function emit(type:string,...args:any[])
	
	function makeMessageHandler(workerEntry, messageType:string, messageHandler:TProcessMessageHandler)
	
	/**
	 * Add a worker message handler
	 *
	 * @param type
	 * @param fn
	 */
	function addMessageHandler(type:string,fn:TMessageHandler)
	
	/**
	 * Remove worker message handler
	 *
	 * @param type
	 * @param fn
	 */
	export function removeMessageHandler(type:string,fn?:TMessageHandler)
	
	/**
	 * Send a message to the worker parent
	 *
	 * @param type
	 * @param body
	 */
	function sendMessage(type:string, body?:any)
	
}