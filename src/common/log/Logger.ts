
import {isString} from "typeguard"
import * as TypeLogger from "typelogger"

TypeLogger.setLogThreshold(TypeLogger.LogLevel.INFO)

//const LogQueueMaxRecords = 1000

enum LogLevel {
	debug = 1,
	info,
	warn,
	error
}

const LogLevelNames = Object.keys(LogLevel).filter(isString)
let Threshold = LogLevel.info

/**
 * Get a logger
 *
 * @param name
 * @returns {string}
 */
export function getLogger(name:string):TypeLogger.ILogger {

	name = name.split('/').pop()!
	return LogLevelNames.reduce((logger:TypeLogger.ILogger,level) => {
		logger[level as any] = (...args:any[]) => {
			// const msgLevel = (LogLevel as any)[level as any] as LogLevel
			// if (msgLevel < Threshold)
			// 	return

			// if (isDefined(getStoreState) && [LogLevel.info,LogLevel.error,LogLevel.warn].includes(msgLevel)) {
			//   const
			//     error = args.filter((arg:any) => arg instanceof Error),
			//     message = args.filter((arg:any) => !(arg instanceof Error)).join(" ")
			//
			//   //LogFirehose.log(msgLevel,name,message,error.length ? error[0] : null)
			//
			// }

			//baseLogger[level](name,...args)
			if (console[level as any]) {
				console[level as any](name,...args)
			} else {
				console.log(name,...args)
			}
		}
		return logger
	},{
		isDebugEnabled
	} as any) as TypeLogger.ILogger
}

export function setThreshold(threshold:LogLevel):void {
	Threshold = threshold
}

export function enableDebug():void {
	setThreshold(LogLevel.debug)
}

export function isDebugEnabled():boolean {
	return LogLevel.debug >= Threshold
}

export default getLogger
