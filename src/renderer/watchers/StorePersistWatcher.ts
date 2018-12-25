import {IStateConstructor, State} from "typedux"
import {AppActionFactory} from "../store/actions/AppActionFactory"
import {AppState} from "../store/state/AppState"
import * as _ from 'lodash'
import {isFunction} from "typeguard"
import * as Fs from 'fs'
import getLogger from "common/log/Logger"
import {getUserDataDir} from "common/Paths"
import {IActionFactoryBaseConstructor} from "../store/actions/ActionFactoryBase"

const
	log = getLogger(__filename),
	dir = `${getUserDataDir()}/state`

if (!Fs.existsSync(dir))
	Fs.mkdirSync(dir)

/**
 * Configure leaf persistence
 *
 * @param factoryConstructor
 * @param stateConstructor
 */
function setupLeafPersistence<S extends State<string>>(factoryConstructor:IActionFactoryBaseConstructor<S>, stateConstructor:IStateConstructor<string,S>):void {
	
	// LEAF FILENAME
	const filename = `${dir}/${stateConstructor.Key}.json`
	
	// LOAD THE STATE
	if (Fs.existsSync(filename)) {
		try {
			const state = stateConstructor.fromJS(JSON.parse(Fs.readFileSync(filename,'utf-8')))
			log.info(`Loaded ${filename}`)
			new factoryConstructor().setState(state)
		} catch (err) {
			log.error(`Unable to hydrate from: ${filename}`, err)
		}
	}
	
	// SAVING FLAG
	let saving = false
	
	/**
	 * Save the state
	 *
	 * @param state
	 */
	async function saveState(state:S):Promise<void> {
		saving = true
		try {
			const
				stateJS = isFunction(state.toJS) ? state.toJS() : state,
				persistState = JSON.stringify(stateJS)
			
			log.info(`Saving state: ${filename}`)
			await Fs.promises.writeFile(filename, persistState, {encoding: 'utf-8'})
		} catch (err) {
			log.error("Unable to save state", err)
		} finally {
			saving = false
		}
	}
	
	// REFERENCE THE SAVE STATE FUNC
	let scheduleSaveState: (state:S) => void
	
	// eslint-disable-next-line
	scheduleSaveState = _.debounce((state:S) => {
		if (saving) {
			scheduleSaveState(getStoreState()[stateConstructor.Key])
			return
		}
		
		saveState(state)
			.catch(err => log.error("Unable to save state", err))
	}, 500)
	
	// ATTACH OBSERVER
	getStore().observe(stateConstructor.Key,scheduleSaveState)
}

// SETUP PERSISTENCE FOR ALL NODES
async function init():Promise<void> {
	setupLeafPersistence(AppActionFactory, AppState)
}

export default init()
