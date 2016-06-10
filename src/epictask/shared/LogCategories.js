const LogLevel = {
	TRACE: 1,
	DEBUG: 2,
	INFO: 3,
	WARN: 4,
	ERROR: 5
}

module.exports = {
	RootReducer: LogLevel.INFO,
	ModelDecorations: LogLevel.INFO,
	GitHubClient: LogLevel.INFO,
	RepoActionFactory: LogLevel.DEBUG,
	LunrIndex: LogLevel.DEBUG
}