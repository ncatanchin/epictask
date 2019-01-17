
import { useState } from 'react'

interface VoidFunction {
  (): void
}

interface VoidFunctionCreator {
  (): VoidFunction
}

const max: number = 9007199254740990 // Number.MAX_SAFE_INTEGER - 1

const useForceUpdate: VoidFunctionCreator = (): VoidFunction => {
  const [ , setState ] = useState(0)
  return (): void => {
    setState((state: number) => (state + 1) % max)
  }
}

export default useForceUpdate
