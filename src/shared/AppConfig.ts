/**
 * App Config Interface
 */
export interface AppConfig {
	paths: {
		userDataPath: string
		cachePath: string
		tempPath: string
	}
}

// Singleton Ref - app config only created once
let appConfig:AppConfig

/**
 * Get the current app config
 *
 * @returns {AppConfig}
 */
export function getAppConfig() {
	if (!appConfig) {
		
		if (ProcessConfig.isType(ProcessType.UI,ProcessType.Main, ProcessType.Test)) {
			const electron = require('electron')
			const app = electron.app || electron.remote.app
			const userDataPath = app.getPath('userData')
			
			appConfig = {
				paths: {
					userDataPath,
					cachePath: `${userDataPath}/Cache`,
					tempPath: app.getPath('temp')
				}
			}
		} else {
			if (!process.env.EPIC_CONFIG)
				throw new Error('EPIC_CONFIG env var must be specified for all processes except UI,Main and Test')
			
			appConfig = JSON.parse(process.env.EPIC_CONFIG)
		}
	}
	return appConfig
}

// getAppConfig
export default getAppConfig