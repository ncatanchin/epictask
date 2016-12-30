// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { GithubNotification } from "epic-models"
import { IRowState, RepoLabel } from "epic-ui-components/common"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { shallowEquals } from "epic-global"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

const
	EntityIcons = {
		Issue: 'issue-opened',
		PullRequest: 'git-pull-request',
		Release: 'tag',
		Commit: 'git-commit',
		Unknown: 'circle-slash'
	}

function baseStyles(topStyles, theme, palette) {
	
	const
		{ success,alternateText,text, primary, accent, background } = palette
	
	return [ Styles.FlexRowCenter, Styles.FlexAuto, Styles.FillWidth, {
		backgroundColor: background,
		
		// IF PARTICIPATING IN THREAD - not 'subscribed'
		participating: [{
			backgroundColor: success.hue1,
		}]
	} ]
}


/**
 * INotificationListItemProps
 */
export interface INotificationListItemProps extends IThemedAttributes {
	rowState?:IRowState<string,string,GithubNotification>
	
	isSelected?:boolean
	isSelectedMulti?:boolean
}

/**
 * INotificationListItemState
 */
export interface INotificationListItemState {
	
}


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)

export class NotificationListItem extends React.Component<INotificationListItemProps,INotificationListItemState> {
	
	constructor(props,context) {
		super(props,context)
		this.state = {}
	}
	
	shouldComponentUpdate(nextProps, nextState) {
		return !shallowEquals(
				nextProps,
				this.props,
				'rowState',
				'style',
				'styles',
				'theme',
				'palette'
			) || !shallowEquals(nextState, this.state)
	}
	
	render() {
		const
			{ styles,rowState } = this.props,
			notification = rowState.item,
			participating = notification.reason !== 'subscribed',
			{subject} = notification,
			entityType = subject.type
		
		return <div style={[styles,participating && styles.participating,rowState.style]}>
			<Icon iconSet="octicon" iconName={EntityIcons[subject.type] || EntityIcons.Unknown} />
			<div style={[Styles.FlexScale,Styles.FlexColumn,Styles.Ellipsis]}>
				<RepoLabel style={Styles.Ellipsis} repo={notification.repository} />
				<div style={Styles.Ellipsis} >{notification.subject.title}</div>
			</div>
			
		</div>
	}
	
}