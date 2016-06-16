/**
 * Created by jglanz on 6/16/16.
 */

// Imports
import * as moment from 'moment'
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {User,Issue} from 'shared/models'
import * as Constants from 'shared/Constants'

import {Avatar,Markdown,PureRender,Renderers} from 'components/common'

// Constants
const log = getLogger(__filename)
const styles = {
	root: {},

	activityContent: makeStyle(FlexColumn,FlexScale,OverflowHidden,{
		borderWidth: '0.1rem',
		borderStyle: 'solid',
		borderRadius: '0 0.2rem 0.2rem 0.2rem',

		details: makeStyle(FlexRow,makeFlexAlign('center','flex-start'),FlexAuto,PositionRelative,{
			padding: '0.3rem 1rem',
			height: 40,
			fontSize: themeFontSize(1.1),
			username: {
				fontWeight: 700
			},
			time: {
				fontSize: themeFontSize(1.1),
				padding: '0rem 0 0 0.5rem'
			}
		}),


		body: makeStyle(FlexColumn,FlexAuto,{
			padding: '1rem',

		}),

		commentor: makeStyle({
			padding: '0rem'
		})
	})
}


function mapStateToProps(state) {
	const appState = state.get(Constants.AppKey)
	return {
		theme: appState.theme
	}
}

/**
 * IIssueCommentProps
 */
export interface IIssueActivityTextProps extends React.DOMAttributes {
	theme?:any
	user:User
	text:string
	activityActionText:string
	issue:Issue
	activityStyle:any
	updatedAt:Date
	createdAt:Date
	activityType:'post'|'comment'
}

/**
 * IssueComment
 *
 * @class IssueActivityText
 * @constructor
 **/

@connect(mapStateToProps)
@Radium
@PureRender
export class IssueActivityText extends React.Component<IIssueActivityTextProps,any> {


	constructor(props, context) {
		super(props, context)
	}


	render() {
		const
			{
				theme,
				activityStyle,
				user,
				text,
				issue,
				updatedAt,
				createdAt,
				activityType,
				activityActionText
			} = this.props,

			// Merge all styles for theming
			s = mergeStyles(
				styles,
				{[activityType]: styles.activityContent},
				activityStyle,
				theme.issueActivityText),

			// Grab the activity type style
			activityTypeStyle = makeStyle(s[activityType]),

			// Time styles
			timeStyle = makeStyle(s.time,activityTypeStyle.details.time),

			// User/Avatar style
			userStyle = makeStyle(
				activityStyle.user,
				activityStyle[activityType].user,
				activityTypeStyle.user
			)

		return <div {...this.props} style={activityStyle}>
			{/* COMMENTOR AVATAR*/}
			<Avatar user={user}
			        style={userStyle}
			        labelPlacement='none'
			        avatarStyle={makeStyle(s.avatar,activityStyle.avatar)} />

			<div style={activityTypeStyle}>
				<div style={activityTypeStyle.details}>
					<div style={activityTypeStyle.details.username}>{user.login}</div>
					<div style={timeStyle}>{activityActionText} {moment(createdAt).fromNow()}</div>
					{createdAt !== updatedAt &&
						<div style={timeStyle}>updated {moment(updatedAt).fromNow()}</div>}
				</div>
				<Markdown className={`markdown issue-${issue.id}`}
				          style={activityTypeStyle.body} source={text || 'No Body'}/>

			</div>
		</div>
	}

}