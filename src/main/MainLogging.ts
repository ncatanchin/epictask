import {getLogger as LoggerFactory,setCategoryLevels,setLoggerOutput} from 'typelogger'
import * as path from 'path'

const mkdirp = require('mkdirp')
const winston = require('winston')
const processType = process.env.PROCESS_TYPE
const logFilename = `${process.cwd()}/logs/${processType || 'unknown'}.log`
const logDir = path.dirname(logFilename)
mkdirp.sync(logDir)

console.info('Using log file @', logFilename)
var logger = new (winston.Logger)()

logger.add(winston.transports.File,{
	name: 'electron-file-log',
	filename: logFilename,
	//level: 'debug',
	tailable: true,
	colorize: true,
	//showLevel: false,
	json: false
})
//winston.level = 'debug'
//winston.remove(winston.transports.Console)
logger.add(winston.transports.Console,{
	colorize:true,
	//level: 'debug',
	showLevel: true
})

Object.assign(global as any,{MainLogger:logger,LoggerFactory})

setLoggerOutput(logger)
setCategoryLevels(require('shared' +
	'/LogCategories'))

declare global {
	var getLogger:typeof LoggerFactory
}


// Export globals
Object.assign(global as any,{
	getLogger: LoggerFactory
})

export {

}
