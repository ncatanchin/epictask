import {ChildProcessManager as ChildProcessManagerType} from 'shared/ChildProcessManager'

export function getProcessManager() {
	return require('shared/ChildProcessManager').ChildProcessManager as typeof ChildProcessManagerType
}
