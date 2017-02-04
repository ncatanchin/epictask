import { getValue, isObject } from "typeguard"
import "./LogDebugConfig"
import './LogCategories'
import {
	setPrefixGlobal,
	getLogger as LoggerFactory,
	ILogger,
	setCategoryLevels,
	setLoggerOutput
} from 'typelogger'
import * as path from 'path'
import _ from './LoDashMixins'
import { getAppConfig } from "./AppConfig"
import { ProcessType } from "./ProcessType"


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
	if (DEBUG && !ProcessConfig.isType(ProcessType.Test)) {
		try {
			Reactotron = require('reactotron-react-js').default
		} catch (err) {
			console.info(`Reactotron could not load`)
		}
	}
}

function getLogPrefix() {
	return getValue(() => '' + getWindowId(),ProcessConfig.getTypeName())
}

/**
 * Custom log Factory
 */
export function EpicLoggerFactory(name:string): IEpicLogger {
	
	const
		rootLogger = LoggerFactory(name) as any
	
	
	
	function makeTronLevel(level,tronLevel) {
			return (...args) => {
				rootLogger[level](...args)
				
				if (level === 'error' && deepTrace) {
					const
						errors = args.filter(arg => arg instanceof Error)
					
					errors.forEach(deepTrace)
				}
				
				if (Reactotron) {
					const
						preview = `${getLogPrefix()} >> ${getValue(() => args[0].toString(),'no value')}`
					
					Reactotron.display({
						name: tronLevel,
						preview,
						value: args.length === 1 ?
							args[0] :
							args.filter(it => !isObject(it)),
						important: ['warn','error'].includes(tronLevel)
					})
				}
				
			}
	}
	
	const
		logger = Object.assign({},rootLogger)
	
	logger.tron = makeTronLevel('info','tron')
	logger.info = logger.tronInfo = makeTronLevel('info','info')
	logger.warn = logger.tronWarn = makeTronLevel('warn','warn')
	logger.error = logger.tronError = makeTronLevel('error','error')
	
	if (!['development','test'].includes(process.env.NODE_ENV)) {
		logger.setOverrideLevel = (newLevel) => {
			console.warn(`NODE_ENV=${process.env.NODE_ENV} / no overrides`)
		}
	}
	return logger
}


loadReactotron()

if (ProcessConfig.isStorybook()) {
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
		baseDir = !DEBUG ? getAppConfig().paths.userDataPath : cwd && cwd.length ? cwd : '/tmp',
		logDir = path.resolve(baseDir,'logs'),
		logFilename = `${logDir}/${processType || ProcessConfig.getTypeName(ProcessType.Main)}.log`
	
	// Create the log file root
	mkdir.sync(logDir)
	DEBUG_LOG('Using log file @', logFilename)
	
	// Create the Winston Logger
	const
		MainLogger = new (winston.Logger)()
	
	// Add file transport
	MainLogger.add(winston.transports.File, {
		name: 'electron-file-log',
		filename: logFilename,
		tailable: true,
		colorize: true,
		json: false,
		maxsize: 5000000,
		maxFiles: 5
	})
	
	if (!TEST && DEBUG) {
		MainLogger.add(winston.transports.Console, {
			colorize: true,
			prettyPrint: true,
			depth: 3
		})
	}
	// Expose the main logger - really so the UI/Renderer can attach if needed
	Object.assign(global as any, {
		MainLogger,
		LoggerFactory:EpicLoggerFactory,
		getLogger: EpicLoggerFactory
	})
	
	const wrappedLogger = [ 'trace', 'debug', 'info', 'warn', 'error' ].reduce((newLogger, levelName) => {
		newLogger[ levelName ] = function (...args) {
			
			MainLogger[ levelName ](...args.filter(it => !_.isObject(it)))
			// if (!ProcessConfig.isTest() && typeof console !== 'undefined') {
			// 	guard(() => (console[ levelName ] || console.log).apply(console, args))
			// }
		}
		return newLogger
	}, {})
	
	// Set the MainLogger as the output for TypeLogger
	setLoggerOutput(wrappedLogger as any)
}


// CATEGORY LOG LEVELS
setCategoryLevels(require('./LogCategories'))


declare global {
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var getLogger:typeof EpicLoggerFactory
}
