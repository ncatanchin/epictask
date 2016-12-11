// Imports
import { PureRender } from './PureRender'
import { IThemedAttributes} from 'epic-styles'

import ViewState from "epic-typedux/state/window/ViewState"
import { PromisedComponent } from "./PromisedComponent"
import { getValue } from "typeguard"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


/**
 * IViewProps
 */
export interface IViewProps extends IThemedAttributes {
	viewState:ViewState
}

/**
 * IViewState
 */
export interface IViewState {
	
}

/**
 * View
 *
 * @class View
 * @constructor
 **/

@PureRender
export class View extends React.Component<IViewProps,IViewState> {
	
	render() {
		const
			{viewState} = this.props,
			
			componentProps = {
				viewState,
				viewStateId: viewState.id
			},
			
			componentLoader = getValue(() => getViews()[viewState.type].provider)
		
		log.debug(`View state type`,viewState.type,componentLoader)
		return !componentLoader ? React.DOM.noscript() : <PromisedComponent loader={componentLoader} componentProps={componentProps}  />
	}
	
}