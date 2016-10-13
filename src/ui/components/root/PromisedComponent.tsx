// Imports
import { connect } from 'react-redux'
import { PureRender } from 'ui/components/common/PureRender'
import { createStructuredSelector } from 'reselect'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { IThemedAttributes } from "shared/themes/ThemeDecorations"
import { getValue } from "shared/util/ObjectUtil"
import { TComponent } from "shared/util/UIUtil"

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
	component?:TComponent
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
		this.setState({
			attachedPromise,
			component: null
		})
		
		// ADD COMPONENT SETTER
		attachedPromise
			.then(component =>
			this.mounted && this.setState({
				component
			}))
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
			attachedPromise:null,
			component: null
		})
	}
	
	render() {
		const
			Component = getValue(() => this.state.component)
		
		return !Component ? React.DOM.noscript() : <Component />
	}
	
}