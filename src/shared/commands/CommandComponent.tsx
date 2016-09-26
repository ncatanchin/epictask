import { ICommand } from "shared/commands/Command"
import { getCommandManager } from "shared/commands/CommandManager"
import * as React from 'react'

const
	log = getLogger(__filename)

/**
 * Options for the future (maybe global commands or something??
 */
export interface ICommandContainerOptions {
	
}


/**
 * Container props
 */
interface ICommandContainerProps extends React.HTMLAttributes<any> {
	commandComponent:ICommandComponentConstructor<any>
}

/**
 * Container state
 */
interface ICommandContainerState {
	instance?:ICommandComponent
	mounted?:boolean
	focused?:boolean
}


/**
 * Container component, provided to children
 */
export class CommandContainer extends React.Component<ICommandContainerProps,ICommandContainerState> {
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {
			mounted: false,
			focused:false
		}
	}
	
	/**
	 * get unwrapped instance
	 */
	get instance():ICommandComponent {
		let
			i = _.get(this,'state.instance',null) as any
		
		if (i && i.getWrappedInstance)
			i = i.getWrappedInstance()
		
		return i
	}
	
	/**
	 * get unwrapped id
	 */
	get id() {
		const
			{instance} = this
		
		return instance && instance.commandComponentId
	}
	
	
	/**
	 * On mount, set 'mounted', then update the commands
	 */
	componentDidMount = () => this.setState({mounted:true},this.updateCommands)
	
	
	/**
	 * On unmount, set 'mounted' = false, then update the commands (remove them)
	 */
	componentWillUnmount = () => this.setState({mounted:false},this.updateCommands)
	
	/**
	 * Set the command component instance
	 *
	 * @param instance
	 */
	setInstance = (instance:ICommandComponent) => {
		if (!instance) {
			log.info(`Instance set to null`,this)
			return
		}
		
		const
			i = instance as any
		
		// JUST IN CASE ITS WRAPPED IN RADIUM OR CONNECT/REDUX
		instance
		
		
		this.setState({instance},this.updateCommands)
	}
	
	/**
	 * On focus
	 *
	 * @param event
	 */
	onFocus = (event:React.FocusEvent<any>) => {
		
		
		const
			{instance,id} = this,
			{focused} = this.state
		
		log.info(`focused`,id)
		
		assert(instance,`Focused, but no instance???`)
		
		if (focused) {
			log.info(`Already focused`)
		} else {
			this.setState({ focused: true })
		}
		
		getCommandManager().setContainerFocused(id, this, true,event)
		
		if (instance.onFocus)
			instance.onFocus(event)
	}
	
	/**
	 * On blur event
	 *
	 * @param event
	 */
	onBlur = (event:React.FocusEvent<any>) => {
		const
			{instance,id} = this,
			{focused} = this.state
		
		log.info(`blurred`,id)
		assert(instance,`Blur, but no instance???`)
		
		if (!focused) {
			log.info(`Blur, but not focused`)
		} else {
			this.setState({ focused: false })
		}
		
		getCommandManager().setContainerFocused(id, this, false,event)
		
		if (instance.onBlur)
			instance.onBlur(event)
	}
	
	
	/**
	 * Update the commands when we get a new instance or changes are registered
	 */
	updateCommands = () => {
		const
			{instance,id} = this,
			{mounted} = this.state
		
		log.info(`Updating commands for ${id}`)
		
		if (!instance) {
			log.warn(`Instance is not set yet, can not do anything, mounted=${mounted}`)
			return
		}
		
		const
			{commands} = instance,
			manager = getCommandManager()
		
		if (mounted) {
			log.info(`Registering commands on container ${id}`,commands)
			manager.registerCommand(this.id,this,...commands)
		} else {
			log.info(`Un=registering commands on container ${id}`,commands)
			manager.unregisterCommand(this.id,this,...commands)
		}
	}
	
	/**
	 * Render the HOC wrapped component
	 */
	render() {
		//noinspection JSUnusedLocalSymbols
		const
			{commandComponent} = this.props,
			Wrapper = {
				commandComponent
			}
		
		return <Wrapper.commandComponent
			tabIndex="-1"
			{..._.omit(this.props,'onFocus','onBlur')}
			onFocus={this.onFocus}
			onBlur={this.onBlur}
			commandContainer={this} ref={this.setInstance}/>
	}
}

/**
 * Properties for a command component
 */
export interface ICommandComponentProps extends React.HTMLAttributes<any> {
	commandContainer?:CommandContainer
}

/**
 * The only property a command component must implement is "commands"
 */
export interface ICommandComponent extends React.Component<ICommandComponentProps,any>{
	readonly commands:ICommand[]
	readonly commandComponentId:string
	
	onFocus?:(event:React.FocusEvent<any>) => any
	onBlur?:(event:React.FocusEvent<any>) => any
	
}

/**
 * Get the required pass thru components
 * @param component
 * @returns {{onFocus,onBlur}
 */
export function getCommandProps(component:ICommandComponent) {
	return _.pick((component as any).props,['tabIndex','onFocus','onBlur']) as {
		tabIndex:number
		onFocus: React.FocusEventHandler<any>,
		onBlur: React.FocusEventHandler<any>
	}
}

/**
 * Constructor for a command component
 */
export interface ICommandComponentConstructor<C extends ICommandComponent> {
	new (props?,context?):C
	defaultProps?:any
}

export type TCommandComponentConstructor = ICommandComponentConstructor<any>

/**
 * Add context for CommandContainer
 *
 * @param opts
 */
export function CommandComponent<T extends TCommandComponentConstructor>(opts:ICommandContainerOptions = {}) {

	/**
	 * @param Component - the component to wrap
	 */
	return ((TargetComponent:T):T => {

		return (function(props,context) {
			return <CommandContainer commandComponent={TargetComponent as any} {...props} />
		}) as any
	})
}


export default CommandComponent