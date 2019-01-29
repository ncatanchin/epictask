import * as React from 'react'
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'

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
    },[elementRef,elementRef.current])

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
  providedOptions?:Partial<ICommandManagerOptions> | null
):CommandManagerRefs {
  if (!providedOptions)
    providedOptions = {...DefaultCommandManagerOptions}

	const
    options = {
	    ...DefaultCommandManagerOptions,
      ...providedOptions
    },
    registered = useRef(false),//getCommandManager().isRegistered(id)
    commandItemsCreatorRef = useRef<CommandItemsCreator>(commandItemsCreator),
		parts = useMemo<CommandManagerRefs>(() => {
			const commandManager = getCommandManager()
			return {
        commandManager,
				props: {
          id,
          tabIndex: options.tabIndex,
          onFocus: (event) => {
            if (!registered.current) {
              log.debug("Not registered")
              return
            } else if (commandManager.inStack(id)) {
              log.debug("in stack")
              return
            }

            const focused = commandManager.isFocused(id)
            log.debug(`focus`,focused, id, event, container.current)
						if (focused) {
							log.debug(`Already focused`)
						} else {
							if (event) {
								event.persist()
                commandManager.updateFocusedContainers()
                // setImmediate(() => {
                //   //commandManager.setContainerFocused(id, true, event)
                //   commandManager.updateFocusedContainers()
                // })
							}
						}
					},
          onBlur: (event) => {
            if (!registered.current) {
              log.warn("Not registered")
              return
            } else if (commandManager.inStack(id)) {
              log.debug("in stack")
              return
            }


            const focused = commandManager.isFocused(id)

            log.debug(`blur`,focused, id, event, container.current, document.activeElement)

            if (focused || !event.nativeEvent.target) {
              log.debug(`Blue (still focused)`)
            } else {
              if (event) {
                registered.current = false
                event.persist()
                commandManager.updateFocusedContainers()
                // setImmediate(() => {
                //   //commandManager.setContainerFocused(id, false, event)
                //   commandManager.updateFocusedContainers()
                // })
              }

            }
					},
        }
      } as CommandManagerRefs
		},[id,container.current])


  // UPDATE PREVIOUS REF IF NEEDED
  useEffect(() => {
    if (commandItemsCreatorRef.current !== commandItemsCreator) {
      commandItemsCreatorRef.current = commandItemsCreator
    }
  }, [commandItemsCreator])

  const
    commandManager = getCommandManager(),
    updateCommandItems = useCallback(() => {
      if (!commandItemsCreatorRef.current || !container.current || !document.querySelector(`#${id}`))
        return

      const
        commandManager = getCommandManager(),
        {menuItems = [], commands = []} = commandItemsCreatorRef.current(new CommandContainerBuilder(container.current,id)),
        focused = commandManager.isFocused(id)

      // if (registered.current && !focused) {
      //   return
      // }

      log.debug("Updating items", id, container.current, commands, menuItems, options, providedOptions)
      commandManager.registerContainerItems(id, container.current, commands, menuItems, options)
      registered.current = true
    },[commandItemsCreatorRef.current])

  useEffect(() => {
    const commandManager = getCommandManager()
    // if (!registered.current || !commandManager.isRegistered(id)) {
    //   commandManager.registerContainerItems(id, container.current, commands, menuItems, options)
    // }
    // if (commandManager.isRegistered(id)) {
    //
    // }
    updateCommandItems()
    return () => {
      registered.current = false
      commandManager.unregisterContainer(id, container.current)
    }
  },[id,container.current, commandItemsCreatorRef.current,updateCommandItems])


  useEffect(() => {
    if (registered.current || !container.current || !id)
      return

    updateCommandItems()
    registered.current = true

    return
  },[parts,id,container,updateCommandItems])

  return parts
}

