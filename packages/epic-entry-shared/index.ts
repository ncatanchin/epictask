

import './AppEntry'

export * from './ProcessType'
export * from './ProcessConfig'

import * as ProcessClientEntryType from './ProcessClientEntry'

export type TProcessClientEntry = typeof ProcessClientEntryType
export function loadProcessClientEntry():TProcessClientEntry {
	return require('./ProcessClientEntry') as TProcessClientEntry
}

export * from './AppConfig'

