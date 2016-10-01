const
	{JobServer,DatabaseServer} = ProcessType

export const
	// IPC & GENERAL TIMEOUTS
	HEARTBEAT_TIMEOUT = 1000,
	START_TIMEOUT_DEFAULT = 60000,
	REQUEST_TIMEOUT = ProcessConfig.isType(JobServer,DatabaseServer) ?
		30000 :
		5000
