// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { viewStatesSelector } from "epic-typedux/selectors/UISelectors"
import ViewState from "epic-typedux/state/window/ViewState"
import { View } from "epic-ui-components/pages/ide/View"
import { getUIActions } from "epic-typedux/provider/ActionFactoryProvider"

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
 * IViewContainerProps
 */
export interface IViewContainerProps extends IThemedAttributes {
	viewStates?: List<ViewState>
}

/**
 * IViewContainerState
 */
export interface IViewContainerState {
	
}

/**
 * ViewContainer
 *
 * @class ViewContainer
 * @constructor
 **/

@connect(createStructuredSelector({
	viewStates: viewStatesSelector
}))

// If you have a specific theme key you want to
// merge provide it as the second param
//@ThemedStyles(baseStyles)
@PureRender
export class ViewContainer extends React.Component<IViewContainerProps,IViewContainerState> {
	
	componentWillMount() {
		if (this.props.viewStates.size < 1) {
			
			// MAKE SURE WE HAVE AT LEAST 1 VIEW
			//getUIActions().ensureDefaultView()
		}
	}
	
	render() {
		const { styles, viewStates } = this.props
		
		return <div style={Fill}>
			{viewStates.map(viewState => <View key={viewState.id} viewState={viewState}/>)}
		</div>
	}
	
}