/**
 * Events used for IPC with database server
 *
 * @type {{Request: string; Response: string}}
 */
export const DatabaseEvents = {
	Ready: 'DatabaseReady',
	Request: 'DatabaseRequest',
	Response: 'DatabaseResponse',
	Stop: 'DatabaseStop',
	Shutdown: 'DatabaseClosed'
}

export default DatabaseEvents