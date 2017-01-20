import {
	CommandType,
	TCommandExecutor,
	TCommandDefaultAccelerator,
	ICommandMenuItem,
	CommandMenuItemType,
	TCommandIcon,
	getCommandManager
} from "epic-command-manager"

import filterProps from "react-valid-props"
import { getValue, isNumber, isString, shortId } from "epic-global"
import { makeStyle } from "epic-styles/styles"


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
export interface ICommandContainerOptions {
	
}


/**
 * Container props
 */
export interface ICommandContainerProps extends React.HTMLAttributes<any> {
	commandComponent:ICommandComponentConstructor<any>
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
		
		log.debug(`Setting instance`,instance)
		
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
		
		log.debug(`On blur`, event, id,'mounted',mounted)
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
		
		log.debug(`Updating commands for ${id}`)
		
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
			{ commandComponent } = this.props,
			Wrapper = {
				commandComponent
			}
		
		return <Wrapper.commandComponent
			tabIndex="-1"
			{..._.omit(this.props, 'ref', 'onFocus', 'onBlur')}
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
export interface ICommandComponentProps extends React.HTMLAttributes<any> {
	commandContainer?:CommandContainer
}

/**
 * Container Command creator type
 */
export type TCommandItemsCreator = (builder:CommandContainerBuilder) => ICommandContainerItems

/**
 * The only property a command component must implement is "commands"
 */
export interface ICommandComponent extends React.Component<ICommandComponentProps,any> {
	commandItems:TCommandItemsCreator
	commandComponentId:string
	
	onFocus?:(event:React.FocusEvent<any>) => any
	onBlur?:(event:React.FocusEvent<any>) => any
	
}

/**
 * Get the required pass thru components
 * @param component
 * @returns {{onFocus,onBlur}
 */
export function getCommandProps(component:ICommandComponent) {
	return _.pick((component as any).props, [ 'tabIndex', 'onFocus', 'onBlur' ]) as {
		tabIndex:number
		onFocus:React.FocusEventHandler<any>,
		onBlur:React.FocusEventHandler<any>
	}
}

/**
 * Constructor for a command component
 */
export interface ICommandComponentConstructor<C extends ICommandComponent> {
	new (props?, context?):C
	defaultProps?:any
}

export type TCommandComponentConstructor = ICommandComponentConstructor<any>

/**
 * Add context for CommandContainer
 *
 * @param opts
 */
export function CommandComponent<T extends TCommandComponentConstructor>(opts:ICommandContainerOptions = {} as any) {
	
	/**
	 * @param Component - the component to wrap
	 */
	return ((TargetComponent:T) => {
		
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
				return getValue(() => this.state.commandContainerRef.getWrappedInstance())
			}
			
			/**
			 * Render the component
			 *
			 * @returns {any}
			 */
			render() {
				return <CommandContainer ref={this.setCommandContainer}
				                         commandComponent={TargetComponent as any} {...this.props} />
			}
		} as any
	}) as any
}

/**
 * Command Root element for controlling focus events, etc
 */
export interface ICommandRootProps extends React.HTMLAttributes<any> {
	component:ICommandComponent & {props:any}
}


/**
 * Command component root node - makes it easier - really
 * just a div
 *
 * @param props
 * @constructor
 */
export class CommandRoot extends React.Component<ICommandRootProps,void> {
	
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
			{ props } = this,
			
			// FILTER ONLY VALID HTML PROPS AND REMOVE onFocus + onBlur
			cleanProps = Object.assign(filterProps(props), {
				onFocus: null,
				onBlur: null,
				style: !props.style ? {} : Array.isArray(props.style) ? makeStyle(...props.style) : props.style
			})
		
		return <div {...cleanProps} {...getCommandProps(props.component)}>
			{props.children}
		</div>
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