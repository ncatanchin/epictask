/**
 * Events used for IPC with database server
 */
export const DatabaseEvents = {
	Ready: 'DatabaseReady',
	Change: 'DatabaseChange',
	Request: 'DatabaseRequest',
	Response: 'DatabaseResponse',
	Stop: 'DatabaseStop',
	Shutdown: 'DatabaseClosed'
}

export default DatabaseEvents