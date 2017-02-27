import { fileExists, cloneObjectShallow } from "epic-global"
import * as Path from 'path'
import * as Fs from 'fs'
import * as VM from 'vm'
import { getValue } from "typeguard"

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)

const
	Extensions = ['','.js','.json']

/**
 * PluginModuleLoader
 */
export class PluginModuleLoader  {
	
	private cache = {} as any
	
	private module:any
	
	get plugin() {
		return getValue(() => this.loader.getPlugin())
	}
	
	constructor(public loader:IPluginLoader, public pluginDirname) {
	
	}
	
	
	compileFile(filename:string) {
		try {
			log.info(`Compile/Loading: ${filename}`)
			
			const
				code = Fs.readFileSync(filename, 'utf8')
			
			return Path.extname(filename) === '.json' ?
				JSON.parse(filename) :
				this.compile(code, filename)
		} catch (err) {
			try {
				return nodeRequire(filename)
			} catch (err2) {
				log.error(`Failed to compile/load: ${filename} / ${err.message}`,err)
				throw err
			}
		}
	}
	
	private makePluginContext() {
		return {
			getPlugin() {
				return this.plugin
			},
			
			
		}
		
	}
	
	/**
	 * Compile a source file
	 *
	 * @param code
	 * @param filename
	 * @returns {{}|any}
	 */
	private compile(code:string,filename:string = 'anonymous') {
		const
			basename = Path.basename(filename),
			dirname = Path.dirname(filename),
			module = this.module = {
				exports: {},
				filename: basename,
				dirname,
				
			},
			moduleRequire = (modName) => {
				log.debug(`pluginRequireModule`,modName)
				if (modName === 'epic-plugin-env') {
					const
						pluginEnv = require('epic-plugin-env')
					
					log.debug(`pluginRequire env`,pluginEnv)
					return pluginEnv
				} else
					return this.pluginRequire(modName,dirname,module)
			}
		
		assign(module,{
			require: moduleRequire
		})
		
		const
			moduleGlobal = cloneObjectShallow(global)
		
		assign(moduleGlobal,{
			Scopes,
			global: moduleGlobal,
			require: moduleRequire,
			Reflect,
			pluginContext: this.makePluginContext(),
			moduleRequire
		})
		
		const
			moduleContext = VM.createContext(moduleGlobal),
			script = new VM.Script(`(function (global,exports, require, module, __filename, __dirname,console) {\n${code}\n})`)
		
		const
			modInit = script.runInContext(moduleContext)
		
		modInit(moduleGlobal,module.exports,moduleRequire,module,basename,dirname,getLogger('console'))
		
		return module.exports
	}
	
	
	pluginRequire = (modName:string, baseDirname:string = null, parentMod:any = null) => {
		
		log.debug(`pluginRequire`,modName,`base dirname`,baseDirname,`parent mod dir`,
			parentMod && parentMod.dirname,`plugin dir`, getValue(() => this.pluginDirname))
		
		if (!baseDirname)
			baseDirname = (parentMod && parentMod.dirname) || getValue(() => this.pluginDirname)
		
		
		const
			cached = this.cache[modName] || getValue(() => nodeRequire(modName)) || nodeRequire.cache[modName]

		if (cached)
			return cached


		if (baseDirname) {
			for (let ext of Extensions) {
				let
					filename = modName + ext
				
				if (!fileExists(filename))
					filename = Path.resolve(baseDirname,filename)
				
				if (fileExists(filename)) {
					try {
						return this.cache[filename] = this.compileFile(filename)
					} catch (err) {
						log.error(`Failed to compile/load (${filename})`,err)
					}
				}
			}
			
		}
		
		return nodeRequire(modName)
		
	}
}
