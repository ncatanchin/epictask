/**
 * IPC Packed Message shape
 */
declare interface IIPCPackagedMessage {
	type:string
	msg: any
}

declare interface IIPCServer {
	/**
	 * Send raw data to socket
	 * @param socket
	 * @param buf
	 */
	send(socket,buf:any)
	
	/**
	 * Send data to a socket
	 *
	 * @param socket
	 * @param event
	 * @param data
	 */
	send(socket,event:string,data:any)
	
	
	/**
	 * Broadcast a buffer
	 *
	 * @param buf
	 */
	broadcast(buf:any)
	/**
	 * Broadcast event
	 *
	 * @param event
	 * @param data
	 */
	broadcast(event:string,data:any)
	
	/**
	 * Start the server
	 */
	start():Promise<any>
	
	/**
	 * Stop the server
	 */
	stop():Promise<any>
	
}