import * as storeRef from 'epic-typedux'
import * as modelsRef from 'epic-models'
import * as databaseClientRef from 'epic-database-client'
import * as uiComponentsRef from 'epic-ui-components'
import * as commandsRef from 'epic-command-manager'
import * as processManagerClientRef from 'epic-process-manager-client'
import * as stylesRef from 'epic-styles'
import * as utilRef from 'epic-global'
import * as registryRef from 'epic-registry'

export * from 'epic-typedux'
export * from 'epic-models'
export * from 'epic-database-client'
export * from 'epic-ui-components'
export * from 'epic-command-manager'
export * from 'epic-process-manager-client'
export * from 'epic-global'
export * from 'epic-registry'
export * from 'epic-styles/ThemeDecorations'
export * from 'epic-styles/ThemeManager'

import Electron = require('electron')

/**
 * Export all the internal components
 * needed to create a plugin
 */
export namespace EpicPluginGlobal {
	export const
		store = storeRef,
		models = modelsRef,
		databaseClient = databaseClientRef,
		uiComponents = uiComponentsRef,
		commands = commandsRef,
		processManagerClient = processManagerClientRef,
		styles = stylesRef,
		util = utilRef,
		registry = registryRef
}

export const EpicPlugin = EpicPluginGlobal

export {
	Electron
}

export default EpicPlugin

export type TEpicPlugin = typeof EpicPluginGlobal

declare global {
	const EpicPlugin:TEpicPlugin
}