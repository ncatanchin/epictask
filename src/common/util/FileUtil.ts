import * as Electron from "electron"
import * as Path from 'path'
import * as Fs from 'fs'
import getLogger from "common/log/Logger"

const log = getLogger(__filename)

export function mkdirs(dir:string):boolean {
  const parts = dir.split(Path.sep).filter(part => part && part.length)
  let path = ""
  for (const part of parts) {
    path = `${path}${Path.sep}${part}`
    if (!Fs.existsSync(path)) {
      log.info("Making dir", path)
      Fs.mkdirSync(path)
      if (!Fs.existsSync(path)) {
        log.error("Unable to create path", path,"of", dir,"parts",parts)
        return false
      }
    }
  }

  if (!Fs.existsSync(dir)) {
    log.error("Unable to create path", path,"of", dir,"parts",parts)
    return false
  }

  return true
}

export function getUserDataDir():string {
  const
    app = process.env.isMainProcess ? Electron.app : Electron.remote.app,
    userDir = app.getPath("userData"),
    dir = Path.resolve(userDir,'epictask')

  if (!mkdirs(dir)) {
    throw Error(`Unable to create dir ${dir}`)
  }

  return dir
}
