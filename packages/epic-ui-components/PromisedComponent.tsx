// Imports
import { PureRender } from "./PureRender"
import { IThemedAttributes } from "epic-styles"
import { getValue, TComponent } from "epic-global"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)



/**
 * IPromisedComponentProps
 */
export interface IPromisedComponentProps extends IThemedAttributes {
	promise:Promise<TComponent>
}

/**
 * IPromisedComponentState
 */
export interface IPromisedComponentState {
	
	attachedPromise?:Promise<TComponent>
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
	
	private component:TComponent
	/**
	 * Attach to the current promise
	 *
	 * @param props
	 */
	private attachToPromise = (props = this.props) => {
		this.mounted = true
		
		let
			attachedPromise = getValue(() => this.state.attachedPromise)
			
		if (attachedPromise === props.promise) {
			log.debug('Promise did not change')
			return
		}
		
		// SET THE PROMISE
		attachedPromise = props.promise
		this.component = null
		
		this.setState({
			attachedPromise
		})
		
		// ADD COMPONENT SETTER
		attachedPromise
			.then(component => {
				if (this.mounted) {
					this.component = component
					setImmediate(() => this.forceUpdate())
					
				}
			})
	}
	
	/**
	 * On mount attach
	 */
	componentWillMount = this.attachToPromise
	
	/**
	 * On new props - check the promise
	 */
	componentWillReceiveProps = this.attachToPromise
	
	/**
	 * On unmount - clean house
	 */
	componentWillUnmount() {
		this.mounted = false
		this.setState({
			attachedPromise:null
		})
	}
	
	render() {
		const
			Component = getValue(() => this.component)
		
		return !Component ? React.DOM.noscript() : <Component />
	}
	
}