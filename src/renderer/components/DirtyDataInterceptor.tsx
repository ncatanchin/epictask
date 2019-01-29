import * as React from "react"
import {ChangeEvent, useCallback, useContext, useEffect, useRef, useState} from "react"
import * as ReactDOM from "react-dom"
import getLogger from "common/log/Logger"
import {IThemedProperties, NestedStyles, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {
  Selectors,
  StyledComponent,
  StyledComponentProducer, StyledElement,
  StyledWrapperComponentProducer
} from "renderer/components/elements/StyledComponent"
import {isDialogOpen, isHTMLElement, isReactComponent} from "common/UIUtil"
import {confirmDialog} from "renderer/util/UIHelper"
import ReactEventListener, {EventListenerProps} from "react-event-listener"
import {getValue, isFunction} from "typeguard"
import {getCommandManager} from "common/command-manager"

const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: []
  }
}



export interface DirtyDataProvider {
  shouldConfirm(client:DirtyDataInterceptorClient, event?:Event):boolean
  intercept(client:DirtyDataInterceptorClient, event?:Event):Promise<boolean>
  ignore(client:DirtyDataInterceptorClient, event?:Event):Promise<void>
}



export interface DirtyDataInterceptorClient {
  enable(target:Element | Text, provider:DirtyDataProvider):void
  disable():void
  forwardTo(event:Event, element?:Element):void
  reset(event?:Event):void
}

export const DirtyDataContext = React.createContext<DirtyDataInterceptorClient>(null)

interface P extends IThemedProperties {

}

interface SP {
}

const selectors = {} as Selectors<P, SP>

export const DirtyDataInterceptor = StyledComponent<P, SP>(baseStyles, selectors)(function DirtyDataInterceptor(props: P): React.ReactElement<P> {
  const
    {classes,children} = props,
    [provider, setProvider] = useState<DirtyDataProvider | null>(null),
    [target,setTarget] = useState<Element | Text | null>(null),
    enabled = !!provider,
    providerRef = useRef<DirtyDataProvider | null>(null),
    makeClient = ():DirtyDataInterceptorClient => {
      return {
        enable: (target:Element | Text,provider:DirtyDataProvider) => {
          log.debug("Set provider", [provider])
          providerRef.current = provider
          setProvider(provider)
          setTarget(target)
        },
        disable: () => setProvider(null),
        forwardTo(event: Event | null, element: Element = null): void {
          if (!event) return
          const
            nativeEvent = event,
            newEvent = new ((nativeEvent as any).constructor)(nativeEvent.type,nativeEvent) as Event,
            target = element || newEvent.target || newEvent.currentTarget

          if (!target) return

          target.dispatchEvent(newEvent)
        },
        reset: (event:Event = null):void => {
          const provider = providerRef.current
          log.debug("Reset",provider, event)
          if (!provider) return

          if (provider.shouldConfirm(client)) {
            confirmDialog(`Discard changes?`)
              .then(async (result) => {
                try {
                  if (result && (await provider.intercept(client, event as any))) {
                    event && client.forwardTo(event as any)
                  }
                } catch (err) {
                  log.error("Confirm error", err)
                }
              })
              .catch(err => log.error("Confirm error", err))
          } else {
            provider.ignore(client, event)
              .catch(err => log.error("Ignore error", err))
          }
        }
      }
    },
    [client,setClient] = useState<DirtyDataInterceptorClient>(makeClient),
    onClickAway = useCallback((event:ChangeEvent | PointerEvent | FocusEvent):void => {
      if (!target) return

      const doc = window.document
      if (!(doc.documentElement && doc.documentElement.contains((event as any).target) && !target.contains((event as any).target))) {
        return
      }

      if (!enabled || isDialogOpen()) return

      const shouldIntercept = provider.shouldConfirm(client,event as any)
      log.debug("Intercept event",shouldIntercept,event)
      if (shouldIntercept) {
        event.stopPropagation()
        event.preventDefault()
        ;(event as any).stopImmediatePropagation()

        client.reset(event as any)
      } else {
        provider.ignore(client,event as any)
          .catch(err => log.error("Ignore error", err))
      }

    },[client,provider]),
    eventProps:EventListenerProps = {target: window.document}
    if (enabled) Object.assign(eventProps,{
      onClickCapture: (event: PointerEvent):void => {
        onClickAway(event as any)
      },
      onBlur: (event:FocusEvent):void => {
        onClickAway(event as any)
      }
    })

  useEffect(() => {
    providerRef.current = provider
  }, [provider])

  return <DirtyDataContext.Provider value={client}>
    <ReactEventListener {...eventProps}>
      {children}
    </ReactEventListener>
  </DirtyDataContext.Provider>
})



export interface DirtyDataProvidedProps {
  enabled: boolean
  ignore?: (client: DirtyDataInterceptorClient, event: Event) => Promise<void>
  intercept?: (client: DirtyDataInterceptorClient, event: Event) => Promise<boolean>
  shouldConfirm?: (client: DirtyDataInterceptorClient, event: Event) => boolean
  target: React.RefObject<Element>
  children: Element | React.ReactElement<any>
}

export function DirtyDataProvided(props:DirtyDataProvidedProps): React.ReactElement<DirtyDataProvidedProps> {
  const
    {target,enabled, ignore,intercept,shouldConfirm,children} = props,
    dirtyDataContext = useContext(DirtyDataContext),
    makeProvider = ():DirtyDataProvider => ({
      ignore: ignore ? ignore : () => Promise.resolve(),
      intercept: intercept ? intercept : () => Promise.resolve(false),
      shouldConfirm: shouldConfirm ? shouldConfirm : () => false,
    }),
    providerRef = useRef<DirtyDataProvider>(null)

  useEffect(() => {
    if (!target.current || !isFunction(target.current.contains)) {
      return
    }

    const focused = !getCommandManager().isFocused(target.current as any)
    log.debug("Dirty data enable", enabled,"target", target, "focused",focused)

    if (enabled) {
      providerRef.current = makeProvider()


      dirtyDataContext.enable(target.current as any,providerRef.current)
    } else {
      dirtyDataContext.disable()
    }
  }, [target.current,enabled,ignore,intercept,shouldConfirm])

  return children as any
}

export function withDirtyDataInterceptor<P = any>():StyledWrapperComponentProducer<P> {
  return (Producer:StyledComponentProducer<P>):StyledComponentProducer<P> => {
    return (props: P): StyledElement<P> => {
      return <DirtyDataInterceptor>
        <Producer {...props}/>
      </DirtyDataInterceptor>
    }
  }
}

export default DirtyDataInterceptor
