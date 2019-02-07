
import * as Electron from "electron"
import * as Fs from "fs"
import * as Path from 'path'
import {getUserDataDir} from "common/util/FileUtil"
import * as _ from 'lodash'
import getLogger from "common/log/Logger"
import {isNumber, isString} from "typeguard"

const log = getLogger(__filename)

class TimestampCache {

  private readonly filename:string

  private readonly cache = new Map<string,number>()

  private debounceFlush = _.debounce(() => {
    try {
      this.write()
    } catch (err) {
      log.error("Unable to write timestamp cache", this.filename, err)
    }
  },500)

  private write():void {
    Fs.writeFileSync(this.filename,JSON.stringify([...this.cache]))
  }

  constructor(public name:string = `window-master`) {
    this.filename = Path.resolve(getUserDataDir(),`${name}.json`)
    if (Fs.existsSync(this.filename)) {
      this.cache = new Map(JSON.parse(Fs.readFileSync(this.filename,'utf-8')))
    }
  }

  get(key:string, defaultValue:number = 0):number {
    const value = this.cache.get(key) || defaultValue
    return (!isNumber(value) || isNaN(value) || [Infinity,-Infinity].includes(value)) ? defaultValue : value
  }

  getAndSet(key:string, newValue:number, defaultValue:number = 0):number {
    const value = this.get(key,defaultValue)
    this.set(key,newValue)
    return value
  }

  set(key:string, newValue:number):void {
    if (isString(newValue)) {
      log.error("New value is a string",newValue,"for",key)
      newValue = 0
    }
    this.cache.set(key,newValue)
    this.flush()
  }

  flush(force:boolean = false):void {
    if (force) {
      this.write()
    } else {
      this.debounceFlush()
    }
  }
}


// TODO: Multi window support
const timestampCache = new TimestampCache()

if (!process.env.isMainProcess) {
  window.addEventListener("unload",() => timestampCache.flush(true))
}

export default timestampCache
