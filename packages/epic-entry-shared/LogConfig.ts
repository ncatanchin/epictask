
import './LogCategories'

import {setPrefixGlobal,getLogger as LoggerFactory,ILogger,setCategoryLevels,setLoggerOutput} from 'typelogger'
import * as path from 'path'
import _ from './LoDashMixins'
import { getAppConfig } from "./AppConfig"
import { ProcessType } from "./ProcessType"
import { getValue, isString } from "typeguard"

let
	Reactotron = null

/**
 * Extended logger interface with tron
 */
export interface IEpicLogger extends ILogger {
	tron(...args):any
	tronWarn(...args):any
	tronError(...args):any
}


setPrefixGlobal(`(${ProcessConfig.getTypeName()}Proc)`)


/**
 * Load Reactotron
 */
function loadReactotron() {
	if (DEBUG && !ProcessConfig.isType(ProcessType.Test) && process.platform === 'darwin') {
		try {
			Reactotron = require('reactotron-react-js').default
		} catch (err) {
			console.info(`Reactotron could not load`)
		}
	}
}

loadReactotron()

function getLogPrefix() {
	return getValue(() => getWindowId(),ProcessConfig.getTypeName())
}

/**
 * Custom log Factory
 */
function EpicLoggerFactory(name:string): IEpicLogger {
	
	const
		rootLogger = LoggerFactory(name) as any
	
	
	
	function makeTronLevel(level,tronLevel) {
			return (...args) => {
				rootLogger[level](...args)
				
				if (Reactotron) {
					const
						preview = `${getLogPrefix()} >> ${getValue(() => args[0].toString(),'no value')}`
					
					Reactotron[tronLevel](preview,{
						level: tronLevel,
						preview,
						value:args,
						important: ['warn','error'].includes(tronLevel)
					})
				}
				
			}
	}
	
	const
		logger = Object.assign({},rootLogger)
	
	logger.tron = makeTronLevel('info','log')
	logger.info = logger.tronInfo = makeTronLevel('info','log')
	logger.warn = logger.tronWarn = makeTronLevel('warn','warn')
	logger.error = logger.tronError = makeTronLevel('error','error')
	
	return logger
}

_.assignGlobal({
	getLogger: EpicLoggerFactory
})

declare global {
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var getLogger:typeof EpicLoggerFactory
}


if (ProcessConfig.isStorybook() || ProcessConfig.isTest()) {
	Object.assign(global as any, {
		LoggerFactory:EpicLoggerFactory,
		getLogger: EpicLoggerFactory
	})
} else {
	
	const
		cwd = process.cwd(),
		mkdir = require('mkdirp'),
		winston = require('winston'),
		processType = ProcessConfig.getTypeName() || process.env.EPIC_ENTRY,
		
		logDir = (DEBUG ?
			path.dirname(cwd && cwd.length ? cwd : '/tmp') :
			getAppConfig().paths.tempPath),
		
		logFilename = `${logDir}/logs/${processType || ProcessConfig.getTypeName(ProcessType.Main)}.log`
	
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
		LoggerFactory:EpicLoggerFactory,
		getLogger: EpicLoggerFactory
	})
	
	const wrappedLogger = [ 'trace', 'debug', 'info', 'warn', 'error' ].reduce((newLogger, levelName) => {
		newLogger[ levelName ] = function (...args) {
			MainLogger[ levelName ](...args.filter(it => !_.isObject(it)))
			
			if (typeof console !== 'undefined') {
				const
					fn = console[ levelName ] || console.log
				fn.apply(console, args)
			}
		}
		return newLogger
	}, {})
	
	// Set the MainLogger as the output for TypeLogger
	setLoggerOutput(wrappedLogger as any)
}


// Configure log levels
setCategoryLevels(require('./LogCategories'))
