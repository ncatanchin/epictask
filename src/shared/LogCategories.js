var LogLevel = {
	TRACE: 1,
	DEBUG: 2,
	INFO: 3,
	WARN: 4,
	ERROR: 5
}

module.exports = {
	ObservableStore: LogLevel.INFO,
	AppStore: LogLevel.INFO,
	RootReducer: LogLevel.INFO,
	ModelDecorations: LogLevel.INFO,
	GitHubClient: LogLevel.INFO,
	RepoActionFactory: LogLevel.INFO,
	LunrIndex: LogLevel.DEBUG,
	Files: LogLevel.INFO
}