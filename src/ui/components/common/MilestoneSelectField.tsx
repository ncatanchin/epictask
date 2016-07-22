/**
 * Created by jglanz on 7/22/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector, createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {repoModelsSelector} from 'shared/actions/data/DataSelectors'
import {Milestone} from 'models/Milestone'
import {Map,List} from 'immutable'
import {Repo} from 'shared/models/Repo'

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumn, FlexAuto, {}]
})


/**
 * IMilestoneSelectFieldProps
 */
export interface IMilestoneSelectFieldProps extends React.HTMLAttributes {
	theme?: any
	styles?: any
	milestone:Milestone
	repoModels?:Map<string,Repo>
	milestoneModels?:Map<string,Milestone>
	onSelected:(milestone:Milestone) => void


	underlineShow?:boolean


}

/**
 * IMilestoneSelectFieldState
 */
export interface IMilestoneSelectFieldState {

}

/**
 * MilestoneSelectField
 *
 * @class MilestoneSelectField
 * @constructor
 **/

@connect(createStructuredSelector({
	repoModels: repoModelsSelector
	// Props mapping go here, use selectors
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@Radium
@PureRender
export class MilestoneSelectField extends React.Component<IMilestoneSelectFieldProps,IMilestoneSelectFieldState> {

	render() {
		const {theme, styles} = this.props

		return <div style={styles.root}>
		</div>
	}

}