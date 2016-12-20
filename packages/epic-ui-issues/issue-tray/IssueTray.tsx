// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { availableReposSelector, trayOpenSelector } from "epic-typedux/selectors"
import { AvailableRepo } from "epic-models"


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

@connect(createStructuredSelector({
	availableRepos: availableReposSelector,
	open: trayOpenSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class IssueTray extends React.Component<IIssueTrayProps,IIssueTrayState> {
	
	render() {
		const { styles } = this.props
		
		return <div style={styles.root}>
		</div>
	}
	
}