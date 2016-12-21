// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { availableReposSelector, trayOpenSelector } from "epic-typedux/selectors"
import { AvailableRepo } from "epic-models"
import { IssueTrayState } from "epic-ui-issues/issue-tray/IssueTrayState"
import { IssueTrayController } from "epic-ui-issues/issue-tray/IssueTrayController"
import { ViewRoot } from "epic-typedux/state/window"


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
 * IIssueTrayProps
 */
export interface IIssueTrayProps extends IThemedAttributes {
	viewController?:IssueTrayController
	viewState?:IssueTrayState
	availableRepos?:List<AvailableRepo>
	open?:boolean
}

/**
 * IIssueTrayState
 */
export interface IIssueTrayState {
	
}

/**
 * IssueTray
 *
 * @class IssueTray
 * @constructor
 **/
@ViewRoot(IssueTrayController, IssueTrayState)
@connect(createStructuredSelector({
	availableRepos: availableReposSelector,
	open: trayOpenSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class IssueTray extends React.Component<IIssueTrayProps,IIssueTrayState> {
	
	get viewController() {
		return this.props.viewController
	}
	
	get viewState() {
		return this.props.viewState
	}
	
	componentWillMount() {
		this.viewController.onMounted()
	}
	
	render() {
		const { styles } = this.props
		
		return <div style={styles.root}>
			issue tray
		</div>
	}
	
}