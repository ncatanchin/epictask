import * as React from "react"
import getLogger from "common/log/Logger"
import {NestedStyles, StyleDeclaration} from "renderer/styles/ThemedStyles"

import {useEffect, useRef, useState} from "react"

const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: []
  }
}

interface P<T> {
  promise:Promise<T>
  unresolvedComponent?: () => (React.ReactNode | JSX.Element)
  children: (data:T | null, err?: Error | null) => (React.ReactNode | JSX.Element)
}

export default function PromisedData<T = any>(props: P<T>): React.ReactElement<P<T>> {
  const
    {promise,unresolvedComponent, children} = props,
    promiseIndex = useRef(0),
    [results, setResults] = useState<T | null>(null),
    [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    promiseIndex.current++
    const thisPromiseIndex = promiseIndex.current
    if (!promise)
      return () => {
        promiseIndex.current = 0
      }

    if (results !== null)
      setResults(null)
    promise
      .then(results => {
        if (promiseIndex.current !== thisPromiseIndex) {
          log.warn("Promise has changed, ignoring result", promiseIndex.current, thisPromiseIndex)
        } else {
          setResults(results)
        }
      })
      .catch(err => {
        log.error("Promise failed to resolve", err)
        setError(err)
      })
    return () => {
      promiseIndex.current = 0
    }
  }, [promise])


  return (results || error ? children(results,error) : unresolvedComponent ? unresolvedComponent() : null) as any
}
