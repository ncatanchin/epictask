

import './AppEntry'

import * as ProcessClientEntryType from './ProcessClientEntry'

export function loadProcessClientEntry() {
	return require('./ProcessClientEntry') as typeof ProcessClientEntryType
}

export * from './AppConfig'
export * from './ProcessConfig'
export * from './ProcessType'
