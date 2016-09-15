
import 'shared/LogCategories'

import {getLogger as LoggerFactory,setCategoryLevels,setLoggerOutput} from 'typelogger'
import * as path from 'path'
import { isObject } from "shared/util"
 

if (ProcessConfig.isStorybook()) {
	Object.assign(global as any, {
		LoggerFactory,
		getLogger: LoggerFactory
	})
} else {
	const
		mkdir = require('mkdirp'),
		winston = require('winston'),
		processType = ProcessConfig.getTypeName() || process.env.EPIC_ENTRY,
		logFilename = `${process.cwd()}/logs/${processType || 'unknown'}.log`,
		logDir = path.dirname(logFilename)
	
	// Create the log file root
	mkdir.sync(logDir)
	console.info('Using log file @', logFilename)
	
	// Create the Winston Logger
	const MainLogger = new (winston.Logger)()
	
	// Add file transport
	MainLogger.add(winston.transports.File, {
		name: 'electron-file-log',
		filename: logFilename,
		tailable: true,
		colorize: true,
		json: false
	})
	
	// Expose the main logger - really so the UI/Renderer can attach if needed
	Object.assign(global as any, {
		MainLogger,
		LoggerFactory,
		getLogger: LoggerFactory
	})
	
	const wrappedLogger = [ 'trace', 'debug', 'info', 'warn', 'error' ].reduce((newLogger, levelName) => {
		newLogger[ levelName ] = function (...args) {
			MainLogger[ levelName ](...args.filter(it => !isObject(it)))
			if (typeof console !== 'undefined') {
				const fn = console[ levelName ] || console.log
				fn.apply(console, args)
			}
		}
		return newLogger
	}, {})
	
	// Set the MainLogger as the output for TypeLogger
	setLoggerOutput(wrappedLogger as any)
}


// Configure log levels
setCategoryLevels(require('shared/LogCategories'))
