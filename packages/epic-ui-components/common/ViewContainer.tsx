// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector} from 'reselect'
import { PureRender } from './PureRender'
import { IThemedAttributes } from 'epic-styles'
import { viewStatesSelector } from "epic-typedux/selectors/UISelectors"
import ViewState from "epic-typedux/state/window/ViewState"
import { View } from "./View"
import { getUIActions } from "epic-typedux/provider/ActionFactoryProvider"
import { cloneObjectShallow } from "epic-global"

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
	defaultViewConfig?:IViewConfig
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
	
	/**
	 * Ensure we have at least one view or create the default
	 *
	 * @param props
	 */
	private checkDefaultView = (props = this.props) => {
		const
			{viewStates,defaultViewConfig} = props
		
		// MAKE SURE WE HAVE AT LEAST 1 VIEW
		if (viewStates.size < 1 && defaultViewConfig) {
			getUIActions().createView(cloneObjectShallow(defaultViewConfig))
		}
	}
	
	/**
	 * On mount check views
	 */
	componentWillMount = this.checkDefaultView
	
	/**
	 * On new props check views
	 */
	componentWillReceiveProps = this.checkDefaultView
	
	/**
	 * Render the view container
	 *
	 * @returns {any}
	 */
	render() {
		const { styles, viewStates } = this.props
		
		return <div style={makeStyle(FlexColumn,FlexScale,FillHeight)}>
			{viewStates.map(viewState => <View key={viewState.id} viewState={viewState}/>)}
		</div>
	}
	
}