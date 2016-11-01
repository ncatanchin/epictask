

import './AppEntry'

export * from './ProcessType'
export * from './ProcessConfig'

import * as ProcessClientEntryType from './ProcessClientEntry'

export function loadProcessClientEntry() {
	return require('./ProcessClientEntry') as typeof ProcessClientEntryType
}

export * from './AppConfig'

