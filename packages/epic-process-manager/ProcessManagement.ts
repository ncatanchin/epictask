import {ChildProcessManager as ChildProcessManagerType} from './ChildProcessManager'

export function getProcessManager() {
	return require('./ChildProcessManager').ChildProcessManager as typeof ChildProcessManagerType
}
