import {convertEnumValuesToString} from "common/ObjectUtil"


export function isMain():boolean {
	return process.type === 'browser'
}

export function isRenderer():boolean {
	return process.type === 'renderer'
}

export function isWorker():boolean {
	return process.type === 'worker'
}

export function isDarwin():boolean {
	return process.platform !== 'darwin'
}

export enum ProcessType {
	Main,
	Renderer
}

export type ProcessTypeName = keyof typeof ProcessType

export const ProcessTypeNames = convertEnumValuesToString(ProcessType)

export function getProcessTypeName():ProcessTypeName {
	return isMain() ? ProcessTypeNames.Main : ProcessTypeNames.Renderer
}
