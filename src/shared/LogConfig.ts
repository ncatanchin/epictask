
import 'shared/LogCategories'

import {getLogger as LoggerFactory,setCategoryLevels,setLoggerOutput} from 'typelogger'
import * as path from 'path'

const mkdir = require('mkdirp')
const winston = require('winston')
const processType = ProcessConfig.getTypeName() // process.env.PROCESS_TYPE
const logFilename = `${process.cwd()}/logs/${processType || 'unknown'}.log`
const logDir = path.dirname(logFilename)

// Create the log file root
mkdir.sync(logDir)
console.info('Using log file @', logFilename)

// Create the Winston Logger
const MainLogger = new (winston.Logger)()

// Add file transport
MainLogger.add(winston.transports.File,{
	name: 'electron-file-log',
	filename: logFilename,
	tailable: true,
	colorize: true,
	json: false
})

// Add console transport
MainLogger.add(winston.transports.Console,{
	colorize:true,
	showLevel: true
})

// Expose the main logger - really so the UI/Renderer can attach if needed
Object.assign(global as any,{
	MainLogger,
	LoggerFactory,
	getLogger: LoggerFactory
})

// Set the MainLogger as the output for TypeLogger
setLoggerOutput(MainLogger)

// Configure log levels
setCategoryLevels(require('shared/LogCategories'))
