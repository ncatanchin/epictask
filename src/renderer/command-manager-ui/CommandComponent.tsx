import * as React from 'react'
import {
	CommandType,
	TCommandExecutor,
	TCommandDefaultAccelerator,
	ICommandMenuItem,
	CommandMenuItemType,
	TCommandIcon,
	getCommandManager
} from "common/command-manager"

import filterProps from "react-valid-props"
import {getValue, isFunction, isNumber, isString} from "typeguard"
import getLogger from "common/log/Logger"
import * as _ from 'lodash'
import {makeStyle, mergeClasses} from "renderer/styles/ThemedStyles"
import {shortId} from "common/IdUtil"
import * as assert from 'assert'
import {Omit} from "common/Types"

const
	log = getLogger(__filename)
	//commandContainerItems = new WeakMap<CommandContainer,ICommandContainerItems>()

// DEBUG ENABLE
//log.setOverrideLevel(LogLevel.DEBUG)


export interface ICommandContainerItems {
	commands:ICommand[]
	menuItems:ICommandMenuItem[]
}

/**
 * Options for the future (maybe global commands or something??
 */
export interface ICommandContainerOptions<P extends ICommandComponentProps = any> {

}


/**
 * Container props
 */
export interface ICommandContainerProps extends React.HTMLAttributes<any> {
	commandComponent:ICommandComponentConstructor<ICommandComponent>
}

/**
 * Container state
 */
export interface ICommandContainerState {
	instance?:ICommandComponent
	lastPrototype?: any
	
	mounted?:boolean
	//focused?:boolean
	registered?:boolean
	
}


/**
 * Container component, provided to children
 */
export class CommandContainer extends React.Component<ICommandContainerProps,ICommandContainerState> {
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			mounted: false,
			registered: false,
			lastPrototype: null
		}
	}
	
	/**
	 * get unwrapped instance
	 */
	get instance():ICommandComponent {
		let
			i = getValue(() => this.state.instance, null) as any
		
		if (i && i.getWrappedInstance)
			i = i.getWrappedInstance()
		
		return i
	}
	
	/**
	 * get unwrapped id
	 */
	get id() {
		const
			{ instance } = this
		
		return instance && instance.commandComponentId
	}
	
	/**
	 * Return our wrapped instance
	 *
	 * @returns {ICommandComponent}
	 */
	getWrappedInstance() {
		return this.instance
	}
	
	/**
	 * On mount, set 'mounted', then update the commands
	 */
	componentDidMount = () => this.setState({
		mounted: true
	}, this.updateRegistration)
	
	
	/**
	 * On unmount, set 'mounted' = false, then update the commands (remove them)
	 */
	componentWillUnmount = () => this.setState({
		mounted: false,
		registered: false
	}, this.updateRegistration)
	
	
	/**
	 * Whether the container is currently focused or not
	 *
	 * @returns {boolean}
	 */
	isFocused() {
		return getValue(() => this.id && getCommandManager().isFocused(this.id), false)
	}
	
	/**
	 * Set the command component instance
	 *
	 * @param instance
	 */
	private setInstance = (instance:ICommandComponent) => {
		// if (!instance) {
		// 	log.debug(`Instance set to null`, this)
		// 	return
		// }
		
		log.info(`Setting instance`,instance)
		
		this.setState({
			instance,
			registered: false
		}, this.updateRegistration)
	
		// JUST IN CASE ITS WRAPPED IN RADIUM OR CONNECT/REDUX
		// if (this.state.instance && instance !== this.state.instance) {
		// 	this.setState({
		// 		registered: false
		// 	},completeUpdate)
		// } else {
		// 	completeUpdate()
		// }
		
	}
	
	/**
	 * On focus
	 *
	 * @param event
	 * @param fromComponent
	 * @return {any|void|{color}|{fontWeight}}
	 */
	onFocus = (event:React.FocusEvent<any>, fromComponent = false) => {
		
		const
			{ instance, id } = this,
			focused = this.isFocused()
		
		log.debug(`focused`, id, event, instance)
		
		if (!instance) {
			return log.warn(`No instance but focused`, instance, this)
		}
		
		
		if (focused) {
			log.debug(`Already focused`)
		} else {
			if (event) {
				event.persist()
				setImmediate(() => {
					getCommandManager().setContainerFocused(id, this, true, event)
					if (!fromComponent && instance.onFocus) {
						instance.onFocus(event)
					}
				})
			}
		
		}
		
		
	}
	
	/**
	 * On blur event
	 *
	 * @param event
	 * @param fromComponent
	 * @return {any|void|{color}|{fontWeight}}
	 */
	onBlur = (event:React.FocusEvent<any>, fromComponent = false) => {
		
		const
			{ instance, id } = this,
			{ mounted } = this.state,
			focused = this.isFocused()
		
		log.info(`On blur`, event, id,'mounted',mounted)
		if (!mounted)
			return log.debug(`Not mounted`)
		
		if (!instance)
			return log.warn(`Blur, but no instance???`)
		//assert(instance, `Blur, but no instance???`)
		
		if (!focused) {
			log.debug(`Blur, but not focused`)
		} else {
				if (event) {
					event.persist()
					setImmediate(() =>{
						getCommandManager().setContainerFocused(id, this, false, event)
						
						
						if (!fromComponent && instance.onBlur)
							instance.onBlur(event)
					})
				}
			
		}
		
		
		
	}
	
	
	
	
	/**
	 * Update the commands when we get a new instance or changes are registered
	 */
	updateRegistration = () => {
		const
			{ instance, id } = this,
			{ mounted, registered } = this.state
		
		log.info(`Updating commands for ${id}`, instance)
		
		if (!id) {
			log.warn(`id not set, mounted=${mounted}, id=${id}`)
			return
		}
		
		
		// REGISTER
		if (!mounted || (registered && !instance)) {
			getCommandManager().unregisterContainer(this.id,this)
			if (this.state.registered)
				this.setState({registered:false})
		} else if (mounted && !registered && instance) {
			log.debug(`Registering commands on container ${id}`)
			
			const
				{ commands, menuItems } = this.getItems()
			
			getCommandManager()
				.registerContainerItems(this.id, this, commands, menuItems)
			
			this.setState({ registered: true })
		}
		
	}
	
	/**
	 * Get All items for container
	 *
	 * @returns {ICommandContainerItems}
	 */
	private getItems() {
		return this.instance.commandItems(new CommandContainerBuilder(this))
	}
	
	/**
	 * Render the HOC wrapped component
	 */
	render() {
		//noinspection JSUnusedLocalSymbols
		const
			{ commandComponent, ...other } = this.props,
			Wrapper = {
				commandComponent
			}
		
		return <Wrapper.commandComponent
			tabIndex="-1"
			{..._.omit(other, 'ref', 'onFocus', 'onBlur')}
			onFocus={this.onFocus}
			onBlur={this.onBlur}
			commandContainer={this}
			ref={this.setInstance}/>
	}
}

/**
 * Declare shape globally
 */
declare global {
	interface ICommandContainer extends CommandContainer {
	
	}
}

/**
 * Properties for a command component
 */
export interface ICommandComponentProps {
	commandContainer?:CommandContainer
	onFocus?:(event:React.FocusEvent<any>) => void
	onBlur?:(event:React.FocusEvent<any>) => void
}

const commandComponentPropsNames:Array<keyof ICommandComponentProps> = [
	"commandContainer",
	"onFocus",
	"onBlur"
]


export function filterCommandProps<P extends ICommandComponentProps>(props:P):Omit<P,keyof ICommandComponentProps> {
	return _.omit(props,...commandComponentPropsNames) as any
}

/**
 * Container Command creator type
 */
export type TCommandItemsCreator = (builder:CommandContainerBuilder) => ICommandContainerItems

/**
 * The only property a command component must implement is "commands"
 */
export interface ICommandComponent<T = any,P extends ICommandComponentProps = any, S = any> extends React.Component<P,S> {
	commandItems:TCommandItemsCreator
	commandComponentId:string
	
	onFocus?:(event:React.FocusEvent<any>) => void
	onBlur?:(event:React.FocusEvent<any>) => void
	
}

/**
 * Get the required pass thru components
 * @param component
 * @returns {{onFocus,onBlur}
 */
export function getCommandProps(component:ICommandComponent):{
	tabIndex:number
	onFocus:React.FocusEventHandler<any>,
	onBlur:React.FocusEventHandler<any>
} {
	return _.pick((component as any).props, [ 'tabIndex', 'onFocus', 'onBlur' ])
}

/**
 * Constructor for a command component
 */
export interface ICommandComponentConstructor<T extends ICommandComponent<T> = any, P extends ICommandComponentProps = any, S = any> {
	new (props:P, context?:any):ICommandComponent<T,P,S>
	defaultProps?:any
}

export type TCommandComponentConstructor<T extends ICommandComponent<T,P,S> = any,P extends ICommandComponentProps = any, S = any> = ICommandComponentConstructor<T>

/**
 * Add context for CommandContainer
 *
 * @param opts
 */
export function CommandComponent<P extends ICommandComponentProps = any, S = any, T extends ICommandComponent<T,P,S> = any>(
	opts:ICommandContainerOptions<P> = {} as any
):(component:TCommandComponentConstructor<T,P,S>) => T {
	
	/**
	 * @param Component - the component to wrap
	 */
	return ((TargetComponent:ICommandComponentConstructor<T>) => {
		
		return class CommandComponentWrapped extends React.Component<any,any> {
			
			/**
			 * Store the underlying ref
			 *
			 * @param commandContainerRef
			 */
			private setCommandContainer = (commandContainerRef) => this.setState({ commandContainerRef })
			
			/**
			 * Get the command container ref
			 *
			 * @returns {any}
			 */
			getWrappedInstance() {
				return getValue(() => this.state.commandContainerRef.getWrappedInstance(),this.state.commandContainerRef)
			}
			
			/**
			 * Render the component
			 *
			 * @returns {any}
			 */
			render() {
				
					// {className:passedClassName, ...otherProps} = this.props,
					// className = mergeClasses(passedClassName,optClassName)
				return <CommandContainer ref={this.setCommandContainer}
				                         commandComponent={TargetComponent} {...this.props} />
			}
		} as any
	}) as any
}

/**
 * Command Root element for controlling focus events, etc
 */
export interface ICommandRootProps extends React.HTMLAttributes<any> {
	component:ICommandComponent
}


/**
 * Command component root node - makes it easier - really
 * just a div
 *
 * @param props
 * @constructor
 */
export class CommandRoot extends React.Component<ICommandRootProps> {
	
	constructor(props, context) {
		super(props, context)
	}
	
	componentDidMount() {
		// if (this.props.autoFocus) {
		// 	const
		// 		elem = ReactDOM.findDOMNode(this)
		//
		// 	if (elem)
		// 		$(elem).focus()
		// }
	}
	
	componentWillUnmount() {
		// if (this.props.autoFocus) {
		// 	const
		// 		elem = ReactDOM.findDOMNode(this)
		//
		// 	if (elem)
		// 		$(elem).blur()
		// }
	}
	
	render() {
		const
			{ component,onFocus,onBlur,...other } = this.props
			
			// FILTER ONLY VALID HTML PROPS AND REMOVE onFocus + onBlur
			// cleanProps = Object.assign(filterProps(props), {
			// 	onFocus: null,
			// 	onBlur: null
			// })
		
		return <div {...other} {...getCommandProps(component)}/>
		
	}
}


/**
 * Command builder
 */
export class CommandContainerBuilder {
	
	private commands:ICommand[] = []
	
	private menuItems:ICommandMenuItem[] = []
	
	/**
	 * Create with a container
	 *
	 * @param container
	 */
	constructor(public container:CommandContainer) {
	
	}
	
	useCommand(
		command:ICommand,
		execute:TCommandExecutor,
		opts:ICommand = {}
	) {
		assert(this instanceof CommandContainerBuilder, 'Must be an instance of CommandContainerBuilder')
		assert(command && command.id && !command.execute,`Command must be valid with ID and execute must be null`)
		
		const
			cmd = _.assign({},command,{execute},opts) as ICommand
		
		this.commands.push(cmd)
		
		return this
	}
	
	/**
	 * Command factory function
	 *
	 * @param defaultAccelerator
	 * @param execute
	 * @param opts
	 */
	command(
		defaultAccelerator:TCommandDefaultAccelerator,
		execute:TCommandExecutor,
    opts:ICommand = {}
	) {
		
		assert(this instanceof CommandContainerBuilder, 'Must be an instance of CommandContainerBuilder')
		
		const
			cmd = _.assign({
				id: opts.id || `${this.container.id}-${shortId()}`,
				type: CommandType.Container,
				execute,
				defaultAccelerator,
				container: this.container
			}, opts) as ICommand
		
		this.commands.push(cmd)
		
		return this
	}
	
	
	/**
	 * Make menu item
	 *
	 * @param type
	 * @param label
	 * @param icon
	 * @param opts
	 */
	makeMenuItem(type:CommandMenuItemType,
	             label:string,
	             icon?:TCommandIcon,
	             opts?:ICommandMenuItem)
	/**
	 * Make menu item
	 *
	 * @param id
	 * @param commandId
	 * @param icon
	 * @param opts
	 */
	makeMenuItem(id:string,
	             commandId:string,
	             icon?:TCommandIcon,
	             opts?:ICommandMenuItem)
	
	/**
	 * Make menu item
	 *
	 * @param id
	 * @param type
	 * @param label
	 * @param icon
	 * @param opts
	 */
	makeMenuItem(id:string,
	             type:CommandMenuItemType,
	             label:string,
	             icon?:TCommandIcon,
	             opts?:ICommandMenuItem)
	makeMenuItem(...args:any[]) {
		
		let
			id:string,
			type:CommandMenuItemType,
			label:string,
			icon:TCommandIcon,
			commandId:string,
			opts:ICommandMenuItem
		
		if (isNumber(args[ 0 ])) {
			([ type, label, icon, opts ] = args)
		} else if (isString(args[ 1 ])) {
			([ id, commandId, icon, opts ] = args)
			type = CommandMenuItemType.Command
		} else {
			([ id, type, label, icon, opts ] = args)
		}
		
		opts = opts || {}
		
		if (!id) {
			id = opts.id || `${this.container.id}-${label}`
		}
		
		return _.assign({
			id,
			type,
			commandId,
			containerId: this.container.id,
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
	menuItem(type:CommandMenuItemType,
	         label:string,
	         icon?:TCommandIcon,
	         opts?:ICommandMenuItem)
	menuItem(id:string,
	         commandId:string,
	         icon?:TCommandIcon,
	         opts?:ICommandMenuItem)
	menuItem(id:string,
	         type:CommandMenuItemType,
	         label:string,
	         icon?:TCommandIcon,
	         opts?:ICommandMenuItem)
	menuItem(...args:any[]) {
		
		this.menuItems.push((this.makeMenuItem as any)(...args))
		
		return this
	}
	
	/**
	 * Make command container items
	 */
	make():ICommandContainerItems {
		return {
			commands: this.commands,
			menuItems: this.menuItems
		}
	}
	
}


export default CommandComponent
