// Imports
import { PureRender } from './PureRender'
import { IThemedAttributes} from 'epic-styles'

import View from "epic-typedux/state/window/View"
import { PromisedComponent } from "./PromisedComponent"
import { getValue } from "typeguard"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


/**
 * IViewProviderProps
 */
export interface IViewProviderProps extends IThemedAttributes {
	view:View
}

/**
 * IViewProviderState
 */
export interface IViewProviderState {
	
}

/**
 * ViewProvider
 *
 * @class ViewProvider
 * @constructor
 **/

@PureRender
export class ViewProvider extends React.Component<IViewProviderProps,IViewProviderState> {
	
	render() {
		const
			{view} = this.props,
			
			componentProps = {
				view,
				viewId: view.id
			},
			
			componentLoader = getValue(() => getViews()[view.type].provider)
		
		log.debug(`View state type`,view.type,componentLoader)
		return !componentLoader ? React.DOM.noscript() : <PromisedComponent loader={componentLoader} componentProps={componentProps}  />
	}
	
}