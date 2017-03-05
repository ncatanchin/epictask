// Imports
import { PureRender } from "./PureRender"
import { IThemedAttributes } from "epic-styles"
import { getValue } from "epic-global"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)



/**
 * IPromisedComponentProps
 */
export interface IPromisedComponentProps extends IThemedAttributes {
	componentProps?:any
	promise?:Promise<TComponentAny>
	loader?:TPromisedComponentLoader
}

/**
 * IPromisedComponentState
 */
export interface IPromisedComponentState {
	
	attachedPromise?:Promise<TComponentAny>
	attachedLoader?:TPromisedComponentLoader
	
	Component:TComponentAny
}

/**
 * PromisedComponent
 *
 * @class PromisedComponent
 * @constructor
 **/
@PureRender
export class PromisedComponent extends React.Component<IPromisedComponentProps,IPromisedComponentState> {
	
	private mounted = false
	
	
	/**
	 * Attach to the current promise
	 *
	 * @param props
	 */
	private attachToPromise = (props = this.props) => {
		this.mounted = true
		
		let
			{state} = this,
			attachedPromise = getValue(() => state.attachedPromise),
			attachedLoader = getValue(() => state.attachedLoader)
		
		if (props.loader) {
			if (attachedLoader === props.loader) {
				log.debug('Loader did not change')
				return
			}
			
			attachedPromise = props.loader()
			
			this.setState({
				attachedPromise,
				attachedLoader: props.loader,
				Component: null
			})
			
		} else {
			if (attachedPromise === props.promise) {
				log.debug('Promise did not change')
				return
			}
			
			// SET THE PROMISE
			attachedPromise = props.promise
			
			this.setState({
				attachedPromise,
				attachedLoader:props.loader,
				Component: null
			})
			
		}
		
		
		// ADD COMPONENT SETTER
		attachedPromise
			.then(Component => {
				if (this.mounted) {
					this.setState({
						Component
					})
					//setImmediate(() => this.forceUpdate())
					
				}
			})
			.catch(err => log.error(`Failed to load component`, err))
		
	}
	
	reset(reattach = false) {
		this.setState({
			attachedPromise:null,
			Component: null
		}, () => {
			if (reattach)
				this.attachToPromise()
		})
	}
	
	
	onStatusUpdate(status) {
		if (status === 'apply') {
			log.info(`Schedule reset of Promised Component`)
			if (this.props.loader)
				this.props.loader().then(Component => this.setState({Component}))
			//this.reset(true)
			// Promise
			// 	.delay(100)
			// 	.then(() => )
		}
	}
	/**
	 * On mount attach
	 */
	componentWillMount() {
		this.attachToPromise()
		// if (module.hot) {
		// 	module.hot.status(() => this.onStatusUpdate)
		// }
	}
	
	/**
	 * On new props - check the promise
	 */
	componentWillReceiveProps = this.attachToPromise
	
	/**
	 * On unmount - clean house
	 */
	componentWillUnmount() {
		this.mounted = false
		this.reset()
		
		// if (module.hot) {
		// 	module.hot.removeStatusHandler(this.onStatusUpdate)
		// }
	}
	
	render() {
		const
			{componentProps} = this.props,
			Component = getValue(() => this.state.Component)
		
		return !Component ? React.DOM.noscript() : <Component {...componentProps}/>
	}
	
}