// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'

import ViewState from "epic-typedux/state/window/ViewState"
import { PromisedComponent } from "epic-ui-components/common/PromisedComponent"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexColumn, FlexAuto, {} ]
}


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


// If you have a specific theme key you want to
// merge provide it as the second param
// @ThemedStyles(baseStyles)
@PureRender
export class View extends React.Component<IViewProps,IViewState> {
	
	render() {
		const
			{
				styles,
				viewState
			} = this.props,
			componentProps = {
				viewState,
				viewStateId: viewState.id,
				viewController: viewState.controller
			}
		
		return <PromisedComponent loader={viewState.componentLoader} componentProps={componentProps}  />
	}
	
}