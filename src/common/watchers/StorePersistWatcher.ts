import {IStateConstructor, State} from "typedux"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import {AppState} from "common/store/state/AppState"
import * as _ from 'lodash'
import {isFunction} from "typeguard"
import * as Fs from 'fs'
import getLogger from "common/log/Logger"
import {getUserDataDir} from "common/Paths"
import {IActionFactoryBaseConstructor} from "common/store/actions/ActionFactoryBase"
// import {DataState} from "common/store/state/DataState"
// import {DataActionFactory} from "common/store/actions/DataActionFactory"
import {isMain} from "common/Process"
import * as Electron from "electron"
import UIState from "renderer/store/state/UIState"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"

const
	log = getLogger(__filename),
	dir = `${getUserDataDir()}/state`

if (isMain() && !Fs.existsSync(dir))
	Fs.mkdirSync(dir)

/**
 * Configure leaf persistence
 *
 * @param factoryConstructor
 * @param stateConstructor
 */
function setupMainLeafPersistence<S extends State<string>>(factoryConstructor:IActionFactoryBaseConstructor<S>, stateConstructor:IStateConstructor<string,S>):void {

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

function setupIPC():void {
	Electron.ipcMain.on("GetSyncStoreState", (event:Electron.Event,key:keyof IRootState) => {
		event.returnValue = getStoreState()[key]
	})
}


function setupRendererSyncLeaf<S extends State<string>>(
	factoryConstructor:IActionFactoryBaseConstructor<S>,
	stateConstructor:IStateConstructor<string,S>
):void {
	const leafState = stateConstructor.fromJS(Electron.ipcRenderer.sendSync("GetSyncStoreState",stateConstructor.Key)) as S
	new factoryConstructor().setState(leafState)
}

function setupRendererPersistenceLeaf<S extends State<string>>(
  factoryConstructor:IActionFactoryBaseConstructor<S>,
  stateConstructor:IStateConstructor<string,S>
):void {
  //const leafState = stateConstructor.fromJS(Electron.ipcRenderer.sendSync("GetSyncStoreState",stateConstructor.Key)) as S
  const leafState = stateConstructor.fromJS(
  	JSON.parse(
  		localStorage.getItem(stateConstructor.Key) || "{}"
		)
	) as S

  new factoryConstructor().setState(leafState)

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

      localStorage.setItem(stateConstructor.Key,persistState)
    } catch (err) {
      log.error("Unable to save renderer state", err)
    } finally {
      saving = false
    }
  }

  // REFERENCE THE SAVE STATE FUNC
  let scheduleSaveState: (state:S) => void

  // eslint-disable-next-line
  scheduleSaveState = _.debounce((state:S) => {
    if (saving) {
      scheduleSaveState(getRendererStoreState()[stateConstructor.Key])
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
	if (process.env.isMainProcess) {
		setupMainLeafPersistence(AppActionFactory, AppState)
		setupIPC()
	} else {
		setupRendererSyncLeaf(AppActionFactory, AppState)
    setupRendererPersistenceLeaf(UIActionFactory, UIState)
	}
}

export default init()
