import * as React from 'react'
import * as assert from 'assert'
import * as Electron from 'electron'
import {EnumEventEmitter} from 'type-enum-events'
import * as _ from 'lodash'
import {
  CommandContainerElement,
  CommandExecutor,
  CommandMenuItemType,
  CommandType,
  CommonKeys, GlobalKeys,
  ICommandMenuItem,
  ICommandMenuManager,
  ICommandMenuManagerProvider, isCommonKey,
  TCommandDefaultAccelerator,
  TCommandIcon
} from "./Command"
import {CommandAccelerator} from "./CommandAccelerator"
import {InputTagNames, isElectron} from "./CommandManagerConfig"
import {addWindowListener, getCommandBrowserWindow, removeWindowListener} from "./CommandManagerUtil"
import {getValue, guard, isFunction, isNil, isNumber, isString} from "typeguard"
import getLogger from "common/log/Logger"
import {acceptHot, getHot, setDataOnHotDispose} from "common/HotUtil"
import {isMain, isRenderer} from "common/Process"
import {getZIndex, isHTMLElement, isReactComponent} from "common/UIUtil"
import Commands from "common/command-manager/CommandStore"
import * as ReactDOM from "react-dom"
import {cloneObjectShallow} from "common/ObjectUtil"
import {getWindowId} from "common/ElectronUtil"
import {StringMap} from "common/Types"
import {shortId} from "common/IdUtil"
import Scheduler, {ITimerRegistration} from "common/Scheduler"


const
  log = getLogger(__filename),

  // Container to support hot reloading
  instanceContainer = _.clone(getHot(module, 'instanceContainer', (): any => {
  })) as {
    clazz: typeof CommandManager,
    instance: CommandManager,
    hotInstance: CommandManager
  }

// DEBUG ENABLE
//log.setOverrideLevel(LogLevel.DEBUG)


export interface ICommandManagerAutoFocus {
  enabled: boolean
  priority: number
}

export interface ICommandManagerOptions {
  autoFocus: ICommandManagerAutoFocus
  tabIndex: number
}


export const DefaultCommandManagerOptions = {
  tabIndex: -1,
  autoFocus: {
    enabled: false,
    priority: 10
  }
} as ICommandManagerOptions

/**
 *
 * @param priority - higher priority = more likely to gain focus
 */
export function makeCommandManagerAutoFocus(priority: number = 1): ICommandManagerAutoFocus {
  return {
    enabled: true,
    priority
  }
}

export interface ICommandContainerItems {
  commands: ICommand[]
  menuItems: ICommandMenuItem[]
}

export type CommandItemsCreator = (builder: CommandContainerBuilder) => ICommandContainerItems

/**
 * Command container registration
 */
export interface ICommandContainerRegistration {
  id: string
  container: CommandContainerElement
  element?: CommandContainerElement
  available: boolean
  options: ICommandManagerOptions
  focused: boolean
  commands?: ICommand[]
  menuItems?: ICommandMenuItem[]
  observer: MutationObserver
}


function getGlobalShortcut(): Electron.GlobalShortcut {
  const
    electron = require('electron')

  return getValue(() => isMain() ? electron.globalShortcut : electron.remote.globalShortcut)
}

/**
 * Command accelerator data source
 *
 * used for providing accelerator overrides
 */
export interface ICommandAcceleratorDataSource {
  (): StringMap<string>
}

/**
 * Key interceptor used for things like capturing custom accelerators
 *
 * if a key interceptor returns boolean(false) then the event is not consumed by the command manager
 */
export type CommandKeyInterceptor = (event: KeyboardEvent) => any

export enum CommandManagerEvent {
  FocusChanged = 1,
  KeyDown = 2
}

/**
 * The command manager - menu, shortcuts, containers, etc
 */
export class CommandManager extends EnumEventEmitter<CommandManagerEvent> {


  static getInstance() {
    if (!instanceContainer.instance)
      instanceContainer.instance = new CommandManager()

    return instanceContainer.instance
  }


  private focusCheckInterval: ITimerRegistration | null = null

  private focusCheckLastElement: Element | null = null

  /**
   * Menu Manager Provider
   */
  private menuManagerProvider: ICommandMenuManagerProvider

  /**
   * Browser menu commands that were sent to main
   */
  private menuItems: ICommandMenuItem[] = []


  /**
   * Global command list
   */
  private globalCommands: {
    [id: string]: {
      id: string,
      electronAccelerator: string,
      registered: boolean,
      conflict: boolean,
      cmd: ICommand
    }
  } = {}

  /**
   * Map of all currently registered commands
   */
  private commands: { [commandId: string]: ICommand } = {}


  /**
   * Window & document listeners
   */
  private windowListeners

  /**
   * Browser window listeners for electronm
   */
  private bodyListeners


  /**
   * Accelerator data source for custom key mappings
   */
  private acceleratorDataSource: ICommandAcceleratorDataSource

  private keyInterceptor: CommandKeyInterceptor


  /**
   * Map of all current containers
   */
  private containers: { [containerId: string]: ICommandContainerRegistration } = {}

  private get containersArray(): Array<ICommandContainerRegistration> {
    return Object.values(this.containers)
  }

  private stack: Array<ICommandContainerRegistration> = []

  private stackElement: HTMLElement | null = null

  /**
   * Private constructor for creating the command manager
   */
  private constructor() {
    super(CommandManagerEvent)

    this.attachEventHandlers()
    this.load()

  }

  pushStack() {
    this.stack = this.focusedContainers()
    this.stackElement = document.activeElement as HTMLElement
  }

  popStack = _.debounce(() => {
    if (!this.stack.length) return

    const reg = _.first(this.stack)
    this.stack = []

    let focused = false
    try {
      if (this.stackElement) {
        this.stackElement.focus()
        focused = true
      }
    } catch (err) {
      log.warn("unable to select element", this.stackElement, err)
    }

    if (!focused) {
      this.focusOnContainer(reg.id)
    }

    this.stackElement = null
  }, 50)

  private focusCheck = (): void => {
    const isBody = document.activeElement === document.body
    if (!isBody && document.activeElement === this.focusCheckLastElement) {
      //log.info("No new active element", this.focusCheckLastElement)
      return
    }

    this.focusCheckLastElement = isBody ? null : document.activeElement

    const focusedContainers = this.focusedContainers()
    if (focusedContainers.length) return

    const autoFocusContainers = this.containersArray
      .filter(reg => getValue(() => reg.options.autoFocus.enabled, false))
      .sortBy(reg => reg.options.autoFocus.priority, true)

    //log.info("Auto focus containers", autoFocusContainers)
    const focusContainer = autoFocusContainers[0]
    if (focusContainer) {
      this.focusOnContainer(focusContainer.id, false)
    }

  }

  isFocused(idOrElement: string | HTMLElement) {
    const
      element = isString(idOrElement) ? document.querySelector(`#${idOrElement}`) : idOrElement,
      id = isString(idOrElement) ? idOrElement : (element.getAttribute("id") || "none"),
      focusedContainers = this.focusedContainers()

    let focusedContainer = focusedContainers.find(reg => reg.id === id || reg.container === element || reg.element === element)
    if (!focusedContainer && isHTMLElement(element)) {
      focusedContainer = focusedContainers
        .find(reg =>
          reg.id === id ||
          [reg.element, reg.container]
            .some(parent =>
              getValue(() => element.contains(parent as any)) ||
              getValue(() => element === parent)
            )
        )
    }

    if (!isFunction(getValue(() => element.contains))) {
      log.debug("Element is not valid", element)
      return false
    }

    return (!isNil(focusedContainer) && focusedContainer.focused) ||
      element === document.activeElement ||
      element.contains(document.activeElement)

    // getValue(() => idOrElement.contains(reg.element as HTMLElement)) ||
    // getValue(() => idOrElement.contains(reg.container as HTMLElement))))
  }

  private static getContainerElement({id, element, container}: ICommandContainerRegistration) {
    const e = document.querySelector(`#${id}`)
    return e || (element instanceof HTMLElement ? element : (isReactComponent(element) ? ReactDOM.findDOMNode(element) : element) as HTMLElement)
  }

  private static isFocusedContainer(container: ICommandContainerRegistration) {
    const element = CommandManager.getContainerElement(container)
    return element && (element.contains(document.activeElement) || element === document.activeElement)
  }

  isRegistered(id: string): boolean {
    return !!this.containers[id]
  }

  updateFocusedContainers(): void {
    const
      allContainers = Object.values(this.containers) as Array<ICommandContainerRegistration>

    let changes = false
    const focusedContainers = allContainers
      .filter(it => CommandManager.isFocusedContainer(it))
      .sort((c1, c2) => {
        const
          e1 = CommandManager.getContainerElement(c1),
          e2 = CommandManager.getContainerElement(c2)
        return e1.contains(e2) ? 1 :
          e2.contains(e1) ? -1 : 0
      })

    Object
      .entries(this.containers)
      .forEach(([id, status]) => {
        const wasFocused = status.focused
        if (this.stack.includes(status)) {
          if (!status.focused) {
            changes = true
            status.focused = true
          }
          return
        }
        const {commands} = status

        status.focused = focusedContainers.includes(status)
        if (status.focused !== wasFocused)
          changes = true

        if (commands) {
          if (status.focused) {
            this.mountCommand(...commands)
          } else {
            const
              containerCommands = commands
                .filter(it => it.type === CommandType.Container)

            // ONLY UNMOUNT CONTAINER COMMANDS
            this.unmountCommand(...containerCommands)
          }
        }

      })

    if (changes) {
      this.focusCheckLastElement = null
      log.debug("Focused", focusedContainers)
      this.emit(CommandManagerEvent.FocusChanged)

      // LOG THE FOCUS IDS
      if (DEBUG && isRenderer()) {
        $("#focusedContainers").remove()
        $(`<div id="focusedContainers">${
          focusedContainers
            .map(it => {
              const element = CommandManager.getContainerElement(it)
              return element.id || `${element.tagName}`
            })
            .join(" >>> ")
          }</div>`)
          .css({
            position: 'absolute',
            right: 0,
            bottom: 0,
            background: 'white',
            color: 'back',
            zIndex: 100000
          })
          .appendTo($(document.body))
      }
    }
  }

  /**
   * All Focused Containers
   */
  focusedContainers(): ICommandContainerRegistration[] {
    const
      allContainers = Object.values(this.containers) as Array<ICommandContainerRegistration>

    let
      containers = allContainers
        .filter(it => CommandManager.isFocusedContainer(it))
        .sort((c1, c2) => {
          const
            e1 = CommandManager.getContainerElement(c1),
            e2 = CommandManager.getContainerElement(c2)
          return e1.contains(e2) ? 1 :
            e2.contains(e1) ? -1 : 0
        })
    // IF NO CONTAINERS THEN FIND THE TOP VISIBLE CONTAINER
    if (!containers.length)
      containers = allContainers
        .filter(it => {
          const filterElement = CommandManager.getContainerElement(it)
          $(filterElement).is(':visible') &&
          allContainers.every(container => {
            const containerElement = CommandManager.getContainerElement(container)
            return containerElement === filterElement ||
              !$(containerElement).is(':visible') ||
              !containerElement.contains(filterElement)
          })
        })
        .sort((c1, c2) => {
          const
            zIndex1 = getZIndex(c1.element),
            zIndex2 = getZIndex(c2.element)

          return zIndex1 > zIndex2 ?
            1 :
            zIndex2 < zIndex1 ? -1 :
              0
        })

    this.updateFocusedContainers()
    return [...this.stack, ...containers]

  }

  private executeMenuItem(item: ICommandMenuItem, event: any = null) {
    const
      cmd = item.commandId && this.getCommand(item.commandId)

    cmd && cmd.execute(cmd, event)

  }

  private makeExecuteMenuItem(item: ICommandMenuItem) {
    return (event) => this.executeMenuItem(item, event)
  }

  /**
   * Get the menu manager from the configured provider
   *
   * @returns {ICommandMenuManager}
   */
  getMenuManager(): ICommandMenuManager {
    return getValue(() => this.menuManagerProvider(), null)
  }

  /**
   * Set the menu manager provider
   *
   * @param menuManagerProvider
   */
  setMenuManagerProvider(menuManagerProvider: ICommandMenuManagerProvider) {
    this.menuManagerProvider = menuManagerProvider
  }


  /**
   * Set or clear (null) a key interceptor
   * @param keyInterceptor
   */
  setKeyInterceptor(keyInterceptor: CommandKeyInterceptor) {
    this.keyInterceptor = keyInterceptor
  }

  /**
   * Set a custom accelerator datasource
   *
   * @param acceleratorDataSource
   */
  setAcceleratorDataSource(acceleratorDataSource: ICommandAcceleratorDataSource) {
    this.acceleratorDataSource = acceleratorDataSource
  }

  /**
   * Get a command by id
   *
   * @param commandId
   * @returns {ICommand}
   */
  getCommand(commandId: string) {
    let
      cmd = this.commands[commandId]

    if (!cmd) {
      cmd = Object.values(this.commands).find((it: ICommand) => it.name && it.name.endsWith(commandId) || it.id.endsWith(commandId))
    }

    return cmd
  }

  /**
   * Retrieve all current commands
   *
   * @returns {ICommand[]}
   */
  allCommands(): ICommand[] {
    return Object.values(this.commands)
      .filter((cmd: ICommand) => cmd.hideInAllCommands !== true && cmd.hidden !== true)
  }

  /**
   * Find a matching command and accelerator
   *
   * @param commands
   * @param customAccelerators
   * @param event
   * @returns {[ICommand,CommandAccelerator]}
   */
  private matchAcceleratorAndCommand(commands: ICommand[], customAccelerators: StringMap<string>, event): [ICommand, CommandAccelerator] {
    for (const cmd of commands) {
      const
        accel = customAccelerators[cmd.id] || cmd.defaultAccelerator
      if (CommandAccelerator.matchToEvent(accel, event)) {
        return [cmd, new CommandAccelerator(event)]
      }
    }
    return null
  }

  /**
   * Handle the key down event
   *
   * @param event
   * @param fromInputOverride - for md editing really
   */
  onKeyDown = (event: KeyboardEvent, fromInputOverride = false) => {
    if (this.keyInterceptor && this.keyInterceptor(event) === false) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    const
      containers = this.focusedContainers(),
      customAccelerators = getValue(() => this.acceleratorDataSource(), {} as StringMap<string>),
      isInputTarget =
        (event.target && InputTagNames.includes((event.target as HTMLElement).tagName)) ||
        fromInputOverride

    log.debug(`Key down received`, event, `Ordered containers: `, containers.map(it => it.element))

    let cmd


    for (const container of containers) {

      const
        testMatch = this.matchAcceleratorAndCommand(container.commands, customAccelerators, event)

      if (testMatch) {
        const
          [testCmd, accel] = testMatch


        if (testCmd && (!isInputTarget || testCmd.overrideInput || accel.hasNonInputModifier)) {
          cmd = testCmd
          break
        }
      }
    }

    if (!cmd) {

      const
        appCommands = Object
          .values<ICommand>(Commands)
          .filter(it => it.type === CommandType.App) as ICommand[]

      for (const appCmd of appCommands) {
        const
          testMatch = this.matchAcceleratorAndCommand([appCmd], customAccelerators, event)

        if (testMatch) {
          const
            [testCmd, accel] = testMatch


          if (testCmd && (!isInputTarget || testCmd.overrideInput || accel.hasNonInputModifier)) {
            cmd = testCmd
            break
          }
        }
      }
    }

    if (cmd) {
      cmd.execute(cmd, event)
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
  }


  // /**
  //  * Focus event for any component
  //  *
  //  * @param event
  //  */
  // private handleFocus = (event:FocusEvent) => {
  // 	log.debug(`win focus received`,event)
  // }
  //
  // /**
  //  * Blur event for any component
  //  *
  //  * @param event
  //  */
  // private handleBlur = (event:FocusEvent) => {
  // 	log.debug(`win blur received`,event)
  // }

  //private pendingMutations

  /**
   * Before unload - UNBIND - EVERYTHING
   *
   * @param event
   */
  private unload = (event) => {
    log.debug(`Unloading all commands`)
    this.unmountCommand(...Object.values(this.commands))
  }

  /**
   * On window blur
   *
   * @param event
   */
  private onWindowBlur = (event) => {
    log.debug(`blur event`, event,document.activeElement)
    //this.unmountMenuItems(...this.menuItems.filter(item => item.mountsWithContainer))
  }

  /**
   * on window focus
   *
   * @param event
   */
  private onWindowFocus = (event) => {
    log.debug(`focus event`, event, 'active element is', document.activeElement)
    //this.mountMenuItems(...this.menuItems)
  }

  /**
   * on body focus
   *
   * @param event
   */
  private onBodyFocus = (event) => {
    log.debug(`body focus event`, event, 'active element is', document.activeElement)
  }

  /**
   * on doc body blur
   *
   * @param event
   */
  private onBodyBlur = (event) => {
    log.debug(`body blur event`, event)
  }


  /**
   * Attach to event producers
   */
  attachEventHandlers() {
    if (typeof window !== 'undefined') {
      if (this.focusCheckInterval) {
        Scheduler.clear(this.focusCheckInterval)
        this.focusCheckInterval = null
      }

      this.focusCheckInterval = Scheduler.createInterval(this.focusCheck, 150)

      if (!this.windowListeners) {
        this.windowListeners = {
          focus: {
            listener: this.onWindowFocus
          },
          blur: {
            listener: this.onWindowBlur
          },
          keydown: {
            listener: this.onKeyDown
          },
          unload: {
            listener: this.unload
          }

        }

        this.bodyListeners = {
          focus: this.onBodyFocus,
          blur: this.onBodyBlur
        }


        Object
          .keys(this.windowListeners)
          .forEach((eventName: string) => {
            addWindowListener(eventName, this.windowListeners[eventName].listener)
          })

        Object
          .keys(this.bodyListeners)
          .forEach((eventName: string) => {
            document && document.body && document.body.addEventListener(eventName, this.bodyListeners[eventName])
          })
      }
    }
  }

  /**
   * Detach event handlers
   */
  detachEventHandlers() {
    if (this.windowListeners) {
      log.debug(`Detaching window listeners`)


      Object
        .keys(this.windowListeners)
        .forEach((eventName: string) => {
          removeWindowListener(eventName, this.windowListeners[eventName].listener)
        })

      Object
        .keys(this.bodyListeners)
        .forEach((eventName: string) => {
          document && document.body && document.body.removeEventListener(eventName, this.bodyListeners[eventName])
        })

      this.windowListeners = null
      this.bodyListeners = null
    }
  }

  /**
   * Get or create container internally
   *
   * @param id
   * @param container
   * @param available
   * @param options
   * @return {ICommandContainerRegistration}
   */
  private getContainerRegistration(id: string, container: CommandContainerElement, available: boolean, options: Partial<ICommandManagerOptions>): ICommandContainerRegistration | null {
    let
      reg = this.containers[id]

    const
      element: CommandContainerElement = getValue(() => (isReactComponent(container) &&
        ReactDOM.findDOMNode(container) as HTMLElement) || container, getValue(() => reg.element)),
      focused = element === document.activeElement ||
        getValue(() => (element as any).contains(document.activeElement),false)

    if (!element) {
      log.debug("No element",id,container,available)
      return null
    }

    if (!reg) {
      reg = {
        id,
        container,
        available,
        focused,
        commands: [],
        menuItems: [],
        element,
        options: options as any,
        observer: new MutationObserver((mutations: MutationRecord[], observer: MutationObserver): void => {
          let updates = false
          mutations.forEach(mutation => {
            mutation.removedNodes.forEach(node => {
              const match = node === element
              //log.debug("Removed node", node, match)
              if (match) {
                reg.available = reg.focused = false
                updates = true
                this.unregisterContainer(id,reg.container)
                try {
                  reg.observer.disconnect()
                } catch (ex) {
                  log.warn("Unable to disconnect",ex)
                }
                delete this.containers[id]

              }
            })

            mutation.addedNodes.forEach(node => {
              const match = node === element
              //log.debug("Added node", node, match)
              if (match) {
                reg.available = true
                updates = true
              }
            })
          })

          if (updates)
            this.updateFocusedContainers()
        })
      }

      try {
        reg.observer.disconnect()
        reg.observer.observe((element as HTMLElement).parentElement, {
          childList: true
        })
      } catch (ex) {
        log.error("Unable to observe/disconnect", reg, ex)
        return null
      }
      this.containers[id] = reg
      log.debug("Registered container", reg)
    } else {
      reg.container = container
      reg.element = element as any
      reg.available = available
      reg.options = options as any
      reg.focused = focused
      // if (!focused && !available)
      //   reg.focused = false
    }



    return reg
  }

  /**
   * Load or reload keymaps, commands, etc
   */
  load() {
    log.debug(`Loading commands & keymaps`)
  }

  /**
   * Map a menu command
   *
   * @param item
   * @returns {any}
   */
  private mapMenuItem = (item: ICommandMenuItem) => {
    return cloneObjectShallow(item, item.execute && {
      execute: this.makeExecuteMenuItem(item)
    })
  }

  /**
   * Add/Update menu commands
   *
   * @param items
   */
  private addMenuItem(...items: ICommandMenuItem[]) {
    this.menuItems =
      this.menuItems
        .filter(it => !items.find(item => item.id === it.id))
        .concat(items.map(this.mapMenuItem))

  }

  /**
   * Get all menu items in a list of commands
   *
   * @param commands
   * @returns {ICommandMenuItem[]}
   */
  private getMenuItemsFromCommands(...commands: ICommand[]): ICommandMenuItem[] {
    return commands
      .filter(cmd => cmd.menuItem)
      .map(cmd => cmd.menuItem)
  }


  /**
   * Remove a global shortcut
   *
   * @param commands
   */
  removeGlobalShortcut(...commands: ICommand[]) {
    if (!isElectron)
      return

    if (!commands.length) {
      log.info(`No global shortcut commands provided, so removing all`)
      commands = Object.values(this.globalCommands)
    }

    const
      globalShortcut = getGlobalShortcut()

    if (!globalShortcut)
      return

    commands
      .filter(it => it.type === CommandType.Global)
      .forEach(it => {
        const
          shortcut = this.globalCommands[it.id]

        if (!shortcut) {
          log.debug(`No short cut for command`, it)
          return
        }

        log.debug(`Removing global shortcut: ${it.id}`)
        globalShortcut.unregister(shortcut.electronAccelerator)
        delete this.globalCommands[it.id]
      })
  }


  /**
   * Update global shortcuts
   *
   * @param commands
   */
  updateGlobalCommands(commands: ICommand[] = Object.values(Commands)) {
    // TODO: Reimplement window manager
    // const
    // 	isMaster = isWindowMaster()
    //
    // log.debug(`Register global commands, proceed=${isMaster} / windowId=${getWindowId()}`)
    // if (!isMaster)
    // 	return

    log.info("Update accelerators", isMain())
    // if (!isMain()) {
    // 	return
    // }

    const
      globalShortcut = getGlobalShortcut(),
      customAccelerators = getValue(() => this.acceleratorDataSource(), {} as StringMap<string>)

    if (!globalShortcut)
      return

    commands
      .filter(it => it.type === CommandType.Global)
      .forEach(it => {
        if (this.globalCommands[it.id]) {
          log.debug('un-registering global shortcut first', it)
          this.removeGlobalShortcut(it)
        }

        const
          defaultAccel = isString(it.defaultAccelerator) ? it.defaultAccelerator : GlobalKeys[it.defaultAccelerator as CommonKeys],
          // eslint-disable-next-line no-return-assign
          accel = getValue(() => customAccelerators[it.id] = defaultAccel),
          electronAccelerator =
            new CommandAccelerator(accel).toElectronAccelerator(),

          shortcut = this.globalCommands[it.id] = {
            id: it.id,
            cmd: it,
            electronAccelerator,
            registered: false,
            conflict: globalShortcut.isRegistered(electronAccelerator)
          }

        log.debug(`Registering shortcut`, shortcut)
        const
          result = shortcut.registered = (globalShortcut.register(electronAccelerator, () => {
            log.debug(`Executing global shortcut`, shortcut)
            shortcut.cmd.execute(shortcut.cmd)
          })) as any

        log.debug(`Command was registered success=${result}`)

      })
  }

  /**
   * A guarded menu manager command
   *
   * @param fn
   */
  private menuManagerFn(fn: (menuManager: ICommandMenuManager) => any) {
    const
      menuManager = this.getMenuManager()

    if (menuManager) {
      fn(menuManager)
    }
  }

  /**
   * Update menu commands
   *
   * @param items
   * @param force
   */
  private updateMenuItems(items: ICommandMenuItem[], force = false) {
    this.addMenuItem(...items)
    this.menuManagerFn((menuManager) => menuManager.updateItem(...items))

    // LOOK FOR CHANGES
    // let
    // 	changes = force
    //
    // if (!changes) {
    // 	for (let cmd of mappedCommands) {
    // 		if (!shallowEquals(cmd, this.menuItems.find(it => it.id === cmd.id))) {
    // 			changes = true
    // 			changedCommands.push(cmd)
    // 		}
    // 	}
    // }

    //if (changes) {

    //}
  }

  /**
   * Remove a set of menu commands
   *
   * @param items
   */
  private removeMenuItems(items: ICommandMenuItem[]) {

    for (const item of items) {
      const
        index = this.menuItems
          .findIndex(it => it.id === item.id)

      if (index > -1) {
        this.menuItems.splice(index, 1)
      }
    }

    this.menuManagerFn(manager => manager.removeItem(...items))
  }


  /**
   * Mount all menu commands
   *
   * @param items
   */
  private mountMenuItems(...items: ICommandMenuItem[]) {
    if (getValue(() => getCommandBrowserWindow() && !getCommandBrowserWindow().isFocused(),true))
      return

    this.menuManagerFn(manager => manager.showItem(...items))
  }

  /**
   * Unmount a set of menu commands on the main process
   *
   * @param items
   */
  private unmountMenuItems(...items: ICommandMenuItem[]) {
    const
      menuItemIds = items.map(it => it.id)

    log.debug(`Unmounting menu command`, ...menuItemIds)

    this.menuManagerFn(manager => manager.hideItem(...menuItemIds))


  }

  /**
   * Register commands globally
   *
   * @param commands
   */
  private mountCommand(...commands: ICommand[]) {
    this.mountMenuItems(...this.getMenuItemsFromCommands(...commands))


  }

  /**
   * Unmount a set of commands
   *
   * @param commands
   */
  private unmountCommand(...commands: ICommand[]) {
    this.unmountMenuItems(...this.getMenuItemsFromCommands(...commands))
  }

  /**
   * Create a command updater
   *
   * @param cmd
   * @returns {(patch:any)=>undefined}
   */
  private makeCommandUpdater(cmd: ICommand) {
    return (patch) => {
      const
        patchedCmd = _.assign(_.clone(cmd), patch)

      this.registerItems([patchedCmd], [])
    }
  }

  /**
   * Register commands
   *
   * @param commands
   * @param menuItems
   */
  registerItems(commands: ICommand[], menuItems: ICommandMenuItem[]) {
    const
      windowId = getWindowId(),
      expandId = (id: string): string => {
        if (windowId && id.indexOf(`${windowId}-`) !== 0) {
          id = `${windowId}-${id}`
        }
        return id
      },
      ensureValidId = (cmdOrMenuItem: ICommand | ICommandMenuItem): void => {
        cmdOrMenuItem.id = expandId(cmdOrMenuItem.id)
      }

    commands.forEach(cmd => {
      cmd.id = cmd.id || cmd.name
      assert(cmd.id, `A command can not be registered without an id & name`)

      ensureValidId(cmd)

      // ADD OR UPDATE
      delete this.commands[cmd.id]

      this.commands[cmd.id] = cmd

      // IF AN UPDATE MANAGER IS PROVIDED THEN SEND AN UPDATER
      if (cmd.updateManager) {
        const
          cmdUpdater = this.makeCommandUpdater(cmd)

        cmd.updateManager(cmd, {
          setHidden: (hidden: boolean) =>
            cmdUpdater({hidden})
          ,

          setEnabled: (enabled: boolean) =>
            cmdUpdater({enabled})
          ,
          update: (newCmd: ICommand) =>
            cmdUpdater(newCmd)
        })
      }
    })

    const
      allMenuItems: ICommandMenuItem[] = (menuItems || []).concat(this.getMenuItemsFromCommands(...commands))

    allMenuItems.forEach(item => {
      assert(item.id || item.label, `Menu ID or label is required`)
      ensureValidId(item)
    })

    // FINALLY UPDATE MENU ITEMS
    log.debug(`Mounting menu command`, allMenuItems.map(it => it.id))
    this.updateMenuItems(allMenuItems)
    this.updateGlobalCommands(commands)
  }

  /**
   * Un-register commands
   *
   * @param commands
   * @param menuItems
   */
  unregisterItems(commands: ICommand[], menuItems: ICommandMenuItem[]) {
    commands.forEach(cmd => {
      delete this.commands[cmd.id]
    })

    // FINALLY MAKE SURE MENU ITEMS ARE REMOVED
    this.removeMenuItems(this.getAllMenuItems(commands, menuItems))
  }

  /**
   * Get all menu items from commands and
   * base menu items
   *
   * @param commands
   * @param menuItems
   */
  private getAllMenuItems(commands: ICommand[], menuItems: ICommandMenuItem[]): ICommandMenuItem[] {
    return _.uniqBy(this.getMenuItemsFromCommands(...commands).concat(menuItems), 'id') as any
  }

  unregisterContainer(id: string, container: CommandContainerElement) {
    if (this.containers[id]) {
      delete this.containers[id]
    } else {
      const
        keys = Object.keys(this.containers)

      for (const key of keys) {
        if (this.containers[key].container === container) {
          delete this.containers[key]
          break
        }

      }
    }
  }

  /**
   * Register a command
   *
   * @param id
   * @param container
   * @param commands
   * @param menuItems
   * @param options
   */
  registerContainerItems(
    id: string,
    container: CommandContainerElement,
    commands: ICommand[],
    menuItems: ICommandMenuItem[],
    options: ICommandManagerOptions = {...DefaultCommandManagerOptions}
  ) {

    this.registerItems(commands, menuItems)

    const
      reg = this.getContainerRegistration(id, container, true, options)

    if (!reg) {
      log.debug("Can not find reg",id,container,options)
      return
    }

    // UPDATE COMMANDS ON CONTAINER REG
    reg.commands = commands

    const
      allMenuItems = this.getAllMenuItems(commands, menuItems)

    reg.menuItems =
      reg
        .menuItems
        .filter(item => !allMenuItems.find(it => it.id === item.id))
        .concat(allMenuItems)

    this.updateFocusedContainers()
  }

  /**
   * Unregister commands
   *
   * @param id
   * @param container
   * @param commands
   * @param options
   */
  unregisterContainerCommand(id: string, container: CommandContainerElement, options: ICommandManagerOptions, ...commands: ICommand[]) {
    commands.forEach(cmd => {
      log.debug(`Removing command`, cmd.id)
      delete this.commands[cmd.id]
    })

    const reg = this.getContainerRegistration(id, container, false, options)

    if (!reg) {
      log.warn("Can not find reg",id,container,options)
      return
    }
    //status.commands = status.commands.filter(cmd => !commands.find(it => it.id === cmd.id))
    this.unregisterItems(reg.commands, reg.menuItems)
  }

  inStack(id: string): boolean {
    return this.stack.some(reg => reg.id === id)
  }

  /**
   * Set container as focused
   *
   * @param id
   * @param focused
   * @param event
   * @returns {ICommandContainerRegistration}
   */
  setContainerFocused(id: string, focused: boolean, event: React.FocusEvent<any> = null) {
    if (this.inStack(id)) {
      log.info("Elem is in stack, ignoring", id)
      return null
    }

    const
      allContainers = Object
        .values(this.containers),
      focusedContainers = allContainers
        .filter(it => this.stack.includes(it) || CommandManager.isFocusedContainer(it))
        .sort((c1, c2) => {
          const
            e1 = CommandManager.getContainerElement(c1),
            e2 = CommandManager.getContainerElement(c2)
          return e1.contains(e2) ? 1 :
            e2.contains(e1) ? -1 : 0
        })


    this.updateFocusedContainers()

    return status
  }

  /**
   * Set container status available/not-available
   *
   * @param id
   * @param container
   * @param available
   * @param options
   * @return {ICommandContainerRegistration}
   */
  setContainerMounted(id: string, container: CommandContainerElement, available: boolean, options: Partial<ICommandManagerOptions>) {
    const reg = this.getContainerRegistration(id, container, available, options)

    if (!reg) {
      log.warn("Can not find reg for mount=",available,"on",id,container,options)
      return null
    }

    if (getValue(() => reg.commands.length, 0) || getValue(() => reg.menuItems.length, 0)) {
      if (available) {
        this.registerItems(reg.commands, reg.menuItems)
      } else {
        this.unregisterItems(reg.commands, reg.menuItems)
      }
    }

    this.unregisterContainer(id,reg.container)

    return reg
  }

  /**
   * Focus on container
   * @param containerId
   * @param skipEvent
   */
  focusOnContainer(containerId: string, skipEvent = false) {
    const
      containerReg = this.containers[containerId]

    if (!containerReg || !containerReg.element) {
      log.warn(`No container found for ${containerId}`)
      return
    }

    const
      doFocus = (): void => {
        const
          {element} = containerReg,
          focusEvent = (window as any).FocusEvent ? new FocusEvent('focus', {
            relatedTarget: element as any
          }) : document.createEvent("FocusEvent")

        ;(element as any).dispatchEvent(focusEvent)
        $(element).focus()
        //$('#issuesPanel').focus()
      }

    doFocus()
  }
}


/**
 * Get the command manager from anywhere
 * @type {()=>CommandManager}
 */
export const getCommandManager = getHot(module, 'getCommandManager', new Proxy(function () {
}, {
  apply: function (target, thisArg, args) {
    return instanceContainer.clazz.getInstance()
  }
}) as any) as () => ICommandManager


// ADD REMOVE GLOBAL SHORTCUTS
if (isElectron) {
  const
    removeShortcuts = (): void => getCommandManager().removeGlobalShortcut()

  if (isMain()) {
    Electron.app.on('will-quit', () => {
      removeShortcuts()
      Electron.globalShortcut.unregisterAll()
    })
  } else {
    Electron.remote.getCurrentWindow().on('close', removeShortcuts)
  }
}

/**
 * Default export is the singleton getter
 */
export default getCommandManager


// REF TYPE FOR GETTER
export type getCommandManagerType = typeof getCommandManager

/**
 * Add getCommandManager onto the global scope
 */
Object.assign(global, {getCommandManager})

/**
 * getCommandManager global declaration
 */
declare global {

  /**
   * Expose the interface globally
   */
  interface ICommandManager extends CommandManager {

  }


}


/**
 * Command builder
 */
export class CommandContainerBuilder {

  static createCommand(
    container: CommandContainerElement,
    containerId: string,
    defaultAccelerator: TCommandDefaultAccelerator,
    execute: CommandExecutor,
    opts: ICommand = {}
  ) {

    return _.assign({
      id: getValue(() => opts.id, (containerId && `${containerId}-${shortId()}`)),
      type: CommandType.Container,
      name: getValue(() => opts.name, "No name"),
      execute,
      defaultAccelerator,
      container,
      element: container
    }, opts) as ICommand
  }

  private commands: ICommand[] = []

  private menuItems: ICommandMenuItem[] = []

  private omitEscape = false


  /**
   * Create with a container
   *
   * @param container
   * @param containerId
   */
  constructor(
    public container: CommandContainerElement,
    public containerId: string = getValue(() => (container as any).id || $(container).attr("id"))
  ) {
    this.commands = [CommandContainerBuilder.createCommand(
      container,
      containerId,
      CommonKeys.Escape,
      () => {
        log.debug("Default blur", containerId, container)
        guard(() => (container as any).blur())
      },
      {
        id: "default-blur-focus",
        overrideInput: true
      }
    )]

  }


  private pushCommand(newCmd: ICommand): this {
    if (isCommonKey(newCmd.defaultAccelerator,CommonKeys.Escape)) {
      log.debug("Overriding default escape")
      this.ignoreEscape(true)
    }

    this.commands =[
      ...this.commands.filter(cmd => ![cmd.accelerator,GlobalKeys[cmd.accelerator]].includes(newCmd.defaultAccelerator)),
      newCmd
    ]

    return this
  }

  ignoreEscape(omitEscape: boolean = true): this {
    this.omitEscape = omitEscape

    if (omitEscape)
      this.commands = this.commands.filter(cmd => !isCommonKey(cmd.defaultAccelerator,CommonKeys.Escape))

    return this
  }

  useCommand(
    command: ICommand,
    execute: CommandExecutor,
    opts: ICommand = {}
  ): this {
    assert(this instanceof CommandContainerBuilder, 'Must be an instance of CommandContainerBuilder')
    assert(command && command.id && !command.execute, `Command must be valid with ID and execute must be null`)

    const cmd = _.assign({}, command, {execute}, opts) as ICommand

    return this.pushCommand(cmd)
  }

  /**
   * Command factory function
   *
   * @param defaultAccelerator
   * @param execute
   * @param opts
   */
  command(
    defaultAccelerator: TCommandDefaultAccelerator,
    execute: CommandExecutor,
    opts: ICommand = {}
  ) {

    assert(this instanceof CommandContainerBuilder, 'Must be an instance of CommandContainerBuilder')

    const cmd = CommandContainerBuilder.createCommand(this.container, this.containerId, defaultAccelerator, execute, opts)

    return this.pushCommand(cmd)
  }


  /**
   * Make menu item
   *
   * @param type
   * @param label
   * @param icon
   * @param opts
   */
  makeMenuItem(type: CommandMenuItemType,
               label: string,
               icon?: TCommandIcon,
               opts?: ICommandMenuItem)
  /**
   * Make menu item
   *
   * @param id
   * @param commandId
   * @param icon
   * @param opts
   */
  makeMenuItem(id: string,
               commandId: string,
               icon?: TCommandIcon,
               opts?: ICommandMenuItem)

  /**
   * Make menu item
   *
   * @param id
   * @param type
   * @param label
   * @param icon
   * @param opts
   */
  makeMenuItem(id: string,
               type: CommandMenuItemType,
               label: string,
               icon?: TCommandIcon,
               opts?: ICommandMenuItem)
  makeMenuItem(...args: any[]) {

    let
      id: string,
      type: CommandMenuItemType,
      label: string,
      icon: TCommandIcon,
      commandId: string,
      opts: ICommandMenuItem

    if (isNumber(args[0])) {
      ([type, label, icon, opts] = args)
    } else if (isString(args[1])) {
      ([id, commandId, icon, opts] = args)
      type = CommandMenuItemType.Command
    } else {
      ([id, type, label, icon, opts] = args)
    }

    opts = opts || {}
    const containerId = getValue(() => (this.container as any).id) as string | null
    if (!id) {
      id = getValue(() => opts.id) || (containerId && `${containerId}-${label}`)
    }

    return _.assign({
      id,
      type,
      commandId,
      containerId,
      label,
      icon
    }, opts) as ICommandMenuItem

  }

  /**
   * Create a menu item
   *
   * @param type
   * @param label
   * @param icon
   * @param opts
   */
  menuItem(type: CommandMenuItemType,
           label: string,
           icon?: TCommandIcon,
           opts?: ICommandMenuItem)
  menuItem(id: string,
           commandId: string,
           icon?: TCommandIcon,
           opts?: ICommandMenuItem)
  menuItem(id: string,
           type: CommandMenuItemType,
           label: string,
           icon?: TCommandIcon,
           opts?: ICommandMenuItem)
  menuItem(...args: any[]) {

    this.menuItems.push((this.makeMenuItem as any)(...args))

    return this
  }

  /**
   * Make command container items
   */
  make(): ICommandContainerItems {
    return {
      commands: this.commands,
      menuItems: this.menuItems
    }
  }

}


/**
 * Update the singleton on HMR reload & set root clazz
 */

instanceContainer.clazz = CommandManager

if (instanceContainer.hotInstance) {
  instanceContainer.hotInstance.detachEventHandlers()
  Object.setPrototypeOf(instanceContainer.hotInstance, CommandManager.prototype)
  instanceContainer.hotInstance.attachEventHandlers()
}

setDataOnHotDispose(module, () => ({
  // Tack on a ref to the hot instance so we know it's there
  instanceContainer: Object.assign(instanceContainer, {
    hotInstance: instanceContainer.instance
  }),
  getCommandManager
}))

acceptHot(module, log)

