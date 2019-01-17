import getLogger from "common/log/Logger"
import {isPromise} from "typeguard"
import moment from "moment"
import {IThemedProperties} from "renderer/styles/ThemedStyles"
import * as React from "react"
const log = getLogger(__filename)


export function uiTask<T>(fn: () => T | Promise<T>):(
  T extends void ? void :
    T extends Promise<void> ? void :
      T
) {
  try {
    const result = fn() as any
    if (isPromise(result)) {
      result.catch(err => log.error("A UI action (promise) had an error", err))
    }
    return result
  } catch (err) {
    log.error("A UI action had an error", err)
    return null as any
  }
}


export function uiGithubDate(timestamp:string | number):string {

  const ts = moment(timestamp)
  return (Date.now() - ts.valueOf() < 24 * 60 * 60 * 1000) ?
    ts.fromNow() :
    ts.format("MMM D, YYYY")
}

interface GithubDateProps extends IThemedProperties {
  timestamp:string | number
  component?: string | null
}

export function GithubDate(props:GithubDateProps):React.ReactElement<Partial<GithubDateProps>> {
  const {component = "span", timestamp, ...other} = props

  return React.createElement(component, other,uiGithubDate(timestamp))
}
