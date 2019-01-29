import {isNumber} from "typeguard"
import {getHot, setDataOnHotDispose} from "common/HotUtil"
import getLogger from "common/log/Logger"

const log = getLogger(__filename)

export type TimerType = "interval" | "timeout"

export interface ITimerRegistration {
  type: TimerType
  ref: number
  handler: TimerHandler | ((...args: any[]) => void)
  teardown?: () => void
}

const
  intervals: Array<ITimerRegistration> = getHot(module, "intervals", () => []),
  timeouts: Array<ITimerRegistration> = getHot(module, "timeouts", () => [])

setDataOnHotDispose(module, () => ({
  intervals, timeouts
}))

function create(
  type: TimerType,
  handler: TimerHandler | ((...args: any[]) => void),
  timeout: number,
  teardown?: () => void,
  ...args: any[]
): ITimerRegistration {
  const
    [timers, createTimer] = type === "interval" ? [intervals, setInterval] : [timeouts, setTimeout],
    existingTimer = timers.find(timer => timer.handler === handler)

  if (type === "interval" && existingTimer) {
    log.warn("This handler already has a", type, existingTimer)
    return existingTimer
  }

  const reg = {
    type,
    ref: createTimer(handler, timeout, ...args),
    handler,
    teardown
  }

  timers.push(reg)

  return reg
}

export function createInterval(
  handler: TimerHandler | ((...args: any[]) => void),
  timeout: number,
  teardown?: () => void,
  ...args: any[]
): ITimerRegistration {
  return create("interval", handler, timeout, teardown, ...args)
}

export function createTimeout(
  handler: TimerHandler & ((...args: any[]) => void),
  timeout: number,
  teardown?: () => void,
  ...args: any[]
): ITimerRegistration {
  let regRef: ITimerRegistration | null = null

  regRef = create("timeout", () => {
    handler(...args)
    clear(regRef)
  }, timeout, teardown, ...args)

  return regRef
}

export function clear(reg: ITimerRegistration): void
export function clear(ref: number, type: TimerType): void
export function clear(regOrRef: ITimerRegistration | number, type?: TimerType | null): void {
  let reg: ITimerRegistration | null = null
  if (!type && (isNumber(regOrRef) || !regOrRef.type)) {
    throw Error(`If you are providing the number ref (${regOrRef}) to clear, a type (${type}) is required`)
  } else if (!isNumber(regOrRef)) {
    reg = regOrRef
    if (!type) type = reg.type
  }

  const
    [timers, clearFn] = type === "timeout" ? [timeouts, clearTimeout] : [intervals, clearInterval]

  if (!reg && isNumber(regOrRef))
    reg = timers.find(timer => timer.ref === regOrRef)

  if (!reg) {
    log.warn(`Unable to find and clear timer`, regOrRef, type)
    return
  }

  const timerIndex = timers.findIndex(existingReg => existingReg === reg)
  if (timerIndex < 0) {
    log.warn("Could not find ", reg, " in existing ", type, timers)
    return
  }

  clearFn(reg.ref)

  if (reg.teardown) {
    try {
      reg.teardown()
    } catch (err) {
      log.error("Teardown failed", reg, err)
    }
  }

  timers.splice(timerIndex, 1)

}

export function clearAll(): void {
  const timers = [...intervals, ...timeouts]
  timers.forEach(timer => clear(timer))
}

const Scheduler = {
  createInterval,
  createTimeout,
  clear,
  clearAll

}


if (module.hot) module.hot.accept(err => console.error("Hot reload failed", err))

Object.assign(global,{
  getScheduler: () => ({
    intervals,
    timeouts,
    all: [...intervals.map(it => ({...it,type: 'interval'})),...timeouts.map(it => ({...it,type: 'timeout'}))]
  })
})

export default Scheduler
