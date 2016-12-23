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
 * IViewProps
 */
export interface IViewProps extends IThemedAttributes {
	view:View
}

/**
 * IView
 */
export interface IView {
	
}

/**
 * View
 *
 * @class View
 * @constructor
 **/

@PureRender
export class ViewProvider extends React.Component<IViewProps,IView> {
	
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