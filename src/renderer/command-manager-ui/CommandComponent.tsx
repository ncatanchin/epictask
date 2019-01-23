import * as React from 'react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {
  CommandContainerElement as CommandContainer,
  CommandContainerBuilder,
  CommandItemsCreator,
  CommandManager,
  CommandManagerEvent,
  DefaultCommandManagerOptions,
  getCommandManager,
  ICommandContainerItems,
  ICommandManagerOptions
} from "common/command-manager"
import getLogger from "common/log/Logger"

const
	log = getLogger(__filename)

const DefaultCommandContainerItems = {commands: [], menuItems: []} as ICommandContainerItems

export type CommandManagerProps = {
  tabIndex?: number,
  onFocus: React.FocusEventHandler | null
  onBlur: React.FocusEventHandler | null,
  id: string | null
}

export type CommandManagerRefs = {
	props: CommandManagerProps
  commandManager: CommandManager

}

function checkFocused(elementRef:React.RefObject<HTMLElement>):boolean {
  const e = elementRef && elementRef.current
  if (!e)
    return false

  return getCommandManager().isFocused(e)
}

export function useFocused(elementRef:React.RefObject<HTMLElement>):boolean {
  const
    [focused,setFocused] = useState(() => checkFocused(elementRef)),
    onFocusChanged = useCallback(() => {
      if (!elementRef.current) return
      setFocused(checkFocused(elementRef))
    },[elementRef.current])

  useEffect(() => {
    const handler = onFocusChanged
    getCommandManager().addListener(CommandManagerEvent.FocusChanged, handler)
    return () => {
      getCommandManager().removeListener(CommandManagerEvent.FocusChanged, handler)
    }
  },[onFocusChanged])

  return focused
}

export function useCommandManager(
	id: string,
	commandItemsCreator:CommandItemsCreator,
	container:React.RefObject<CommandContainer>,
  providedOptions:Partial<ICommandManagerOptions> | null = {...DefaultCommandManagerOptions}
):CommandManagerRefs {

	const
    options = {
	    ...DefaultCommandManagerOptions,
      ...providedOptions
    },
    registered = useRef(false),
		parts = useMemo<CommandManagerRefs>(() => {
			const commandManager = getCommandManager()
			return {
        commandManager,
				props: {
          id,
          tabIndex: options.tabIndex,
          onFocus: (event) => {
            if (!registered.current) {
              log.warn("Not registered")
              return
            }

            const focused = commandManager.isFocused(id)
            log.debug(`focus`,focused, id, event, container.current)
						if (focused) {
							log.debug(`Already focused`)
						} else {
							if (event) {
								event.persist()
                setImmediate(() => {
                  commandManager.setContainerFocused(id, true, event)
                })
							}
						}
					},
          onBlur: (event) => {
            if (!registered.current) {
              log.warn("Not registered")
              return
            }


            const focused = commandManager.isFocused(id)

            log.debug(`blur`,focused, id, event, container.current)

            if (!focused) {
              log.debug(`Already blurred`)
            } else {
              if (event) {
                event.persist()
                setImmediate(() => {
                  commandManager.setContainerFocused(id, false, event)
                })
              }

            }
					},
        }
      } as CommandManagerRefs
		},[registered.current,id,container.current])


  useEffect(() => {
    if (registered.current || !container.current || !id)
      return () => {}

    const
      commandManager = getCommandManager(),
      {menuItems = [],commands = []} = commandItemsCreator(new CommandContainerBuilder(container.current))

    log.debug("Registering",id,container.current,commands,menuItems,options,providedOptions)
    commandManager.registerContainerItems(id,container.current,commands,menuItems, options)
    registered.current = true

    return () => {
      log.debug("Unregistering",id,container.current,commands,menuItems)
      registered.current = false
      commandManager.unregisterContainer(id,container.current)
    }
  }, [container,container.current,id])

  return parts
}

