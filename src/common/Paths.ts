import * as Electron from 'electron'
import {isMain} from "./Process"

export function getUserDataDir():string {
	const app = isMain() ? Electron.app : Electron.remote.app
	return app.getPath("userData")
}
