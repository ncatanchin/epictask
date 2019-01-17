import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {
  CommandManager,
  CommandMenuItemType,
  CommandType,
  getCommandManager,
  ICommandMenuItem,
  TCommandDefaultAccelerator,
  CommandExecutor,
  TCommandIcon, CommandContainer, CommandItemsCreator, CommandContainerBuilder, ICommandContainerItems
} from "common/command-manager"
import {getValue, guard, isFunction, isNumber, isString} from "typeguard"
import getLogger from "common/log/Logger"
import * as _ from 'lodash'
import {shortId} from "common/IdUtil"
import * as assert from 'assert'
import {Omit} from "common/Types"
import {isReactComponent} from "common/UIUtil"
import {useEffect, useMemo, useRef, useState} from "react"

const
	log = getLogger(__filename)
	//commandContainerItems = new WeakMap<CommandContainer,ICommandContainerItems>()

// DEBUG ENABLE
//log.setOverrideLevel(LogLevel.DEBUG)



// /**
//  * Options for the future (maybe global commands or something??
//  */
// export interface ICommandContainerOptions<P extends ICommandComponentProps = any> {
//
// }
//
//
// /**
//  * Container props
//  */
// export interface ICommandContainerProps extends React.HTMLAttributes<any> {
// 	commandComponent:CommandComponentFn
// }
//
// /**
//  * Container state
//  */
// export interface ICommandContainerState<P extends ICommandComponentProps= any> {
// 	instance:React.Component<P> | null
// 	lastPrototype: any
//   items:ICommandContainerItems | null
// 	mounted:boolean
// 	//focused?:boolean
// 	registered:boolean
// 	id: string | null
//
// }


const DefaultCommandContainerItems = {commands: [], menuItems: []} as ICommandContainerItems

// /**
//  * Container component, provided to children
//  */
// export class CommandContainer extends React.Component<ICommandContainerProps,ICommandContainerState> {
//
// 	constructor(props, context) {
// 		super(props, context)
//
// 		this.state = {
// 			mounted: false,
// 			registered: false,
// 			lastPrototype: null,
// 			items: null,
// 			instance: null,
// 			id: null
// 		}
// 	}
//
// 	/**
// 	 * get unwrapped instance
// 	 */
// 	get instance():ICommandComponent {
// 		let
// 			i = getValue(() => this.state.instance, null) as any
//
// 		if (i && i.getWrappedInstance)
// 			i = i.getWrappedInstance()
//
// 		return i
// 	}
//
// 	/**
// 	 * get unwrapped id
// 	 */
// 	get id() {
// 		return getValue(() => this.instance.commandComponentId,this.state.id)
// 	}
//
// 	/**
// 	 * Return our wrapped instance
// 	 *
// 	 * @returns {ICommandComponent}
// 	 */
// 	getWrappedInstance() {
// 		return this.instance
// 	}
//
// 	/**
// 	 * On mount, set 'mounted', then update the commands
// 	 */
// 	componentDidMount() {
//     this.setState({
//       mounted: true
//     }, this.updateRegistration)
//   }
//
// 	/**
// 	 * On unmount, set 'mounted' = false, then update the commands (remove them)
// 	 */
// 	componentWillUnmount() {
//     this.setState({
//       mounted: false,
//       registered: false
//     }, this.updateRegistration)
//   }
//
// 	/**
// 	 * Whether the container is currently focused or not
// 	 *
// 	 * @returns {boolean}
// 	 */
// 	isFocused() {
// 		return getValue(() => this.id && getCommandManager().isFocused(this.id), false)
// 	}
//
//   /**
//    * Set the command component instance
//    *
//    * @param instance
//    * @param id
//    */
// 	setInstance = (
// 		instance:ICommandComponent,
// 		id:string | null = this.id ||
// 			getValue(() => instance.commandComponentId) ||
//     	getValue(() => (instance as any).id) ||
// 			getValue(() => (ReactDOM.findDOMNode(instance) as HTMLElement).id)
// 	) => {
// 		if (!instance) return
//
// 		log.debug("Setting instance", instance, id)
// 		const changes:Partial<ICommandContainerState> = {
//       instance,
//       registered: false
//     }
//
//     if (id) {
//     	changes.id = id
// 		}
//
// 		this.setState(prevState => ({...prevState,...changes}), this.updateRegistration)
//
// 	}
//
// 	/**
// 	 * On focus
// 	 *
// 	 * @param event
// 	 * @param fromComponent
// 	 * @return {any|void|{color}|{fontWeight}}
// 	 */
// 	onFocus = (event:React.FocusEvent<any>, fromComponent = false) => {
// 		const
// 			{ instance, id } = this,
// 			focused = this.isFocused()
//
// 		log.debug(`focused`, id, event, instance)
//
// 		// if (!instance) {
// 		// 	return log.warn(`No instance but focused`, instance, this)
// 		// }
//
//
// 		if (focused) {
// 			log.debug(`Already focused`)
// 		} else {
// 			if (event) {
// 				event.persist()
// 				setImmediate(() => {
// 					getCommandManager().setContainerFocused(id, this, true, event)
// 					guard(() => !fromComponent && instance && instance.onFocus && instance.onFocus(event))
// 				})
// 			}
//
// 		}
//
//
// 	}
//
// 	/**
// 	 * On blur event
// 	 *
// 	 * @param event
// 	 * @param fromComponent
// 	 * @return {any|void|{color}|{fontWeight}}
// 	 */
// 	onBlur = (event:React.FocusEvent<any>, fromComponent = false) => {
//
// 		const
// 			{ instance, id } = this,
// 			{ mounted } = this.state,
// 			focused = this.isFocused()
//
// 		log.debug(`On blur`, event, id,'mounted',mounted)
// 		if (!mounted)
// 			return log.debug(`Not mounted`)
//
// 		// if (!instance)
// 		// 	return log.warn(`Blur, but no instance???`)
//
// 		if (!focused) {
// 			log.debug(`Blur, but not focused`)
// 		} else {
// 				if (event) {
// 					event.persist()
// 					setImmediate(() =>{
// 						getCommandManager().setContainerFocused(id, this, false, event)
//
//
// 						if (!fromComponent && instance && instance.onBlur)
// 							instance.onBlur(event)
// 					})
// 				}
// 		}
//
//
//
// 	}
//
//
// 	unregister() {
//     getCommandManager().unregisterContainer(this.id,this)
//     if (this.state.registered)
//       this.setState({registered:false})
// 	}
//
// 	/**
// 	 * Update the commands when we get a new instance or changes are registered
// 	 */
// 	updateRegistration = () => {
// 		const
// 			{ instance, id } = this,
// 			{ mounted, registered } = this.state
//
// 		//log.info(`Updating commands for ${id}`, instance, this)
//
// 		if (!id) {
// 			log.warn(`id not set, mounted=${mounted}, id=${id}`)
// 			return
// 		}
//
//
// 		// REGISTER
// 		if (!mounted) {
// 			this.unregister()
// 		} else if (mounted && !registered) {
//
// 			const { commands, menuItems } = this.getItems()
//       log.debug(`Registering commands on container ${id}`,commands,menuItems, instance)
// 			getCommandManager().registerContainerItems(
// 				id,
// 				this,
// 				commands,
// 				menuItems
// 			)
//
// 			this.setState({ registered: true })
// 		}
//
// 	}
//
// 	/**
// 	 * Get All items for container
// 	 *
// 	 * @returns {ICommandContainerItems}
// 	 */
// 	private getItems():ICommandContainerItems {
// 		return this.state.items ? this.state.items : getValue(() => this.instance.commandItems(new CommandContainerBuilder(this)), DefaultCommandContainerItems)
// 	}
//
//   setIdAndItems(id:string, factory:(builder:CommandContainerBuilder) => ICommandContainerItems) {
//     this.setState({
// 			id,
//       items: factory(new CommandContainerBuilder(this))
//     }, this.updateRegistration)
//   }
//
// 	setItems(factory:(builder:CommandContainerBuilder) => ICommandContainerItems) {
// 		this.setState({
// 			items: factory(new CommandContainerBuilder(this))
// 		}, this.updateRegistration)
// 	}
//
// 	setId(id:string) {
// 		this.setState({id})
// 	}
//
// 	/**
// 	 * Render the HOC wrapped component
// 	 */
// 	render() {
// 		//noinspection JSUnusedLocalSymbols
// 		const
// 			{ commandComponent, ...other } = this.props,
// 			Wrapper = {
// 				commandComponent
// 			},
// 			refOpts = {
// 				//...(isReactComponent(Wrapper.commandComponent) ? {ref: this.setInstance} : {}),
//         innerRef: this.setInstance
// 			}
//
//
// 		// log.info("this",Wrapper.commandComponent)
// 		// debugger
// 		return <Wrapper.commandComponent
// 			tabIndex="-1"
// 			{..._.omit(other, 'ref', 'onFocus', 'onBlur')}
// 			onFocus={this.onFocus}
// 			onBlur={this.onBlur}
// 			commandContainer={this}
// 			{...refOpts}
// 			/>
// 	}
// }
//
// /**
//  * Declare shape globally
//  */
// declare global {
// 	interface ICommandContainer extends CommandContainer {
//
// 	}
// }
//
// /**
//  * Properties for a command component
//  */
// export interface ICommandComponentProps<T = any> {
//   containerRef?: React.Ref<T> | React.RefObject<T>
//   innerRef?: React.Ref<T> | React.RefObject<T>
// 	commandContainer?:CommandContainer
// 	onFocus?:(event:React.FocusEvent<any>) => void
// 	onBlur?:(event:React.FocusEvent<any>) => void
// }
//
// const commandComponentPropsNames:Array<keyof ICommandComponentProps> = [
// 	"commandContainer",
// 	"onFocus",
// 	"onBlur",
// 	"containerRef",
// 	"innerRef"
// ]
//
//
// export function filterCommandProps<P extends ICommandComponentProps>(props:P):Omit<P,keyof ICommandComponentProps> {
// 	return _.omit(props,...commandComponentPropsNames) as any
// }
//
// /**
//  * Container Command creator type
//  */

//
// /**
//  * The only property a command component must implement is "commands"
//  */
// export interface ICommandComponent<T = any,P extends ICommandComponentProps = any, S = any> extends React.Component<P,S> {
// 	commandItems?:TCommandItemsCreator
// 	commandComponentId?:string
//
// 	onFocus?:(event:React.FocusEvent<any>) => void
// 	onBlur?:(event:React.FocusEvent<any>) => void
//
// }
//
// /**
//  * Get the required pass thru components
//  * @returns {{onFocus,onBlur}
//  * @param props
//  * @param id
//  */
// export function getCommandProps(props:ICommandComponentProps,id?: string | null)
// export function getCommandProps(component:ICommandComponent,id?: string | null)
// export function getCommandProps(componentOrProps:ICommandComponent | ICommandComponentProps,id: string | null = null):{
// 	tabIndex:number
// 	onFocus:React.FocusEventHandler<any>,
// 	onBlur:React.FocusEventHandler<any>,
// 	ref: React.Ref<any> | React.RefObject<any>
// } {
// 	const props = isReactComponent(componentOrProps) ? (componentOrProps as any).props : componentOrProps
// 	return {
// 		..._.pick(props, [ 'tabIndex', 'onFocus', 'onBlur' ]),
// 		ref: props.containerRef
// 	}
// }
//
// /**
//  * Constructor for a command component
//  */
// export interface ICommandComponentConstructor<T extends ICommandComponent<T> = any, P extends ICommandComponentProps = any, S = any> {
// 	new (props:P, context?:any):ICommandComponent<T,P,S>
// 	defaultProps?:any
// }
//
// export type TCommandComponentConstructor<T extends ICommandComponent<T,P,S> = any,P extends ICommandComponentProps = any, S = any> = ICommandComponentConstructor<T>
//
// export type CommandComponentFn<T extends ICommandComponent<T,P,S> = any,P extends ICommandComponentProps = any, S = any> = TCommandComponentConstructor<T,P,S> | ((props:P) => React.ReactElement<P>)
//
// /**
//  * Add context for CommandContainer
//  *
//  * @param opts
//  */
// export function CommandComponent<P extends ICommandComponentProps = any, S = any, T extends ICommandComponent<T,P,S> = any>(
// 	opts:ICommandContainerOptions<P> = {} as any
// ):(component:CommandComponentFn<T,P,S>) => T {
//
// 	/**
// 	 * @param Component - the component to wrap
// 	 */
// 	return ((TargetComponent:CommandComponentFn<T,P,S>) => {
//
// 		return class CommandComponentWrapped extends React.Component<any,any> {
//
// 			/**
// 			 * Store the underlying ref
// 			 *
// 			 * @param commandContainerRef
// 			 */
// 			private setCommandContainer = (commandContainerRef) => this.setState({ commandContainerRef })
//
// 			/**
// 			 * Get the command container ref
// 			 *
// 			 * @returns {any}
// 			 */
// 			getWrappedInstance() {
// 				return getValue(() => this.state.commandContainerRef.getWrappedInstance(),this.state.commandContainerRef)
// 			}
//
// 			/**
// 			 * Render the component
// 			 *
// 			 * @returns {any}
// 			 */
// 			render() {
// 				return <CommandContainer ref={this.setCommandContainer}
// 				                         commandComponent={TargetComponent} {...this.props} />
// 			}
// 		} as any
// 	}) as any
// }
//
// /**
//  * Command Root element for controlling focus events, etc
//  */
// export interface ICommandRootProps extends React.HTMLAttributes<any>, ICommandComponentProps {
// 	component:ICommandComponent
// }
//
//
// /**
//  * Command component root node - makes it easier - really
//  * just a div
//  *
//  * @param props
//  * @constructor
//  */
// export class CommandRoot extends React.Component<ICommandRootProps> {
//
// 	constructor(props, context) {
// 		super(props, context)
// 	}
//
// 	componentDidMount(): void {
// 		const {commandContainer, id, component} = this.props
//
// 		commandContainer.setInstance(component,id)
//   }
//
//   componentWillUnmount(): void {
//     //const {commandContainer} = this.props
//
//     this.props.commandContainer.unregister()
//   }
//
//   render() {
// 		// noinspection JSUnusedLocalSymbols
//     const { component,onFocus,onBlur,...other } = this.props
// 		return <div {...other} {...getCommandProps((component as any).props)}/>
//
// 	}
// }





export type CommandManagerRefs = {
	props: {
    onFocus: React.FocusEventHandler | null
    onBlur: React.FocusEventHandler | null,
    id: string | null
  }
  commandManager: CommandManager

}

export function useCommandManager(
	id: string,
	commandItemsCreator:CommandItemsCreator,
	container:React.RefObject<CommandContainer>
):CommandManagerRefs {

	const registered = useRef(false)

  function registerCommands():() => void {
    if (registered.current || !container.current || !id) return () => {}
		const commandManager = getCommandManager()
    const {menuItems = [],commands = []} = commandItemsCreator(new CommandContainerBuilder(container.current))
    log.info("Registering",id,container.current,commands,menuItems)
    commandManager.registerContainerItems(id,container.current,commands,menuItems)
    registered.current = true
    // let element = container
    // if (isReactComponent(container))
    // 	element = ReactDOM.findDOMNode(container) as any

    return () => {
      log.info("Unregistering",id,container.current,commands,menuItems)
      registered.current = false
      commandManager.unregisterContainer(id,container.current)
    }
  }

	const
		parts = useMemo<CommandManagerRefs>(() => {
			const commandManager = getCommandManager()
			return {
        commandManager,
				props: {
          id,
          onFocus: (event) => {
            const focused = commandManager.isFocused(id)

						//log.info(`focused`, focused, id, event, container.current)

						if (focused) {
							log.info(`Already focused`)
						} else {
							if (event) {
								event.persist()
								setImmediate(() => {
									if (!registered.current) {
										registerCommands()
									}

									commandManager.setContainerFocused(id, true, event)
								})
							}

						}
					},
          onBlur: (event) => {
            const focused = commandManager.isFocused(id)

            //log.info(`blur`,focused, id, event, container.current)

            if (!focused) {
              log.info(`Already blurred`)
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
		},[id,container.current]),
		{commandManager,props:commandManagerProps} = parts



	useEffect(registerCommands, [container.current,id])

	return parts
}

