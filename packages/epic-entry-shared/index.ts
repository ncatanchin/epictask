

import './AppEntry'

import * as ChildProcessEntryType from './ChildProcessEntry'

export function loadChildProcessEntry() {
	return require('./ChildProcessEntry') as typeof ChildProcessEntryType
}

export * from './AppConfig'
export * from './ProcessConfig'
export * from './ProcessType'
