/**
 * Created by jglanz on 7/23/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender, Icon} from 'ui/components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector, createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {TIssueState} from 'shared/models/Issue'

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [{
		padding: rem(0.3),
		borderRadius: rem(0.3)
	}]
})


/**
 * IIssueStateIconProps
 */
export interface IIssueStateIconProps extends React.HTMLAttributes<any> {
	theme?: any
	styles?: any
	state:TIssueState
}

/**
 * IIssueStateIconState
 */
export interface IIssueStateIconState {

}




/**
 * IssueStateIcon
 *
 * @class IssueStateIcon
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'issueStateIcon')

@PureRender
export class IssueStateIcon extends React.Component<IIssueStateIconProps,IIssueStateIconState> {

	render() {
		const
			{state,theme, styles} = this.props,
			{palette} = theme,
			[iconName,iconStyle] = (state === 'open') ?
				['issue-opened',styles.open] :
				['issue-closed',styles.closed]

		return <Icon style={[styles.root, iconStyle]}
		             iconSet='octicon'
		             iconName={iconName}/>

	}

}