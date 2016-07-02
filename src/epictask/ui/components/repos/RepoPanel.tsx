/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {TRepoState} from 'shared/actions/repo/RepoState'
import {AppActionFactory} from 'shared/actions/AppActionFactory'

import {RepoList,Icon,Button} from 'components'
import {Drawer,RaisedButton} from 'material-ui'
import * as Radium from 'radium'

// Key mapping tools
import * as KeyMaps from 'shared/KeyMaps'
const {CommonKeys:Keys} = KeyMaps
const {HotKeys} = require('react-hotkeys')

// Constants
const log = getLogger(__filename)
//const styles = require("./RepoPanel.css")
const repoActions = new RepoActionFactory()

import { connect } from 'react-redux'
import {AppKey} from '../../../shared/Constants'

const styles = {
	cover: makeStyle(FlexColumn,FlexScale,Fill,{

	}),

	panel: makeStyle(FlexColumn,FlexScale,Fill,{

	}),

	drawerWrapper: makeStyle(FlexColumn,FlexScale,Fill,{
		minWidth: 200,
		position: 'relative'
	}),

	drawer: makeStyle(FlexColumn,FlexScale,FillWidth,{
		minWidth: 200,
		position: 'relative'
	}),

	header: makeStyle(Ellipsis,FlexRowCenter,FlexAuto),
	headerTitle: makeStyle(Ellipsis,FlexScale,{
		fontSize: themeFontSize(1.2),
		padding: '0.4rem 0.5rem'
	}),

	headerButton: makeStyle(FlexRowCenter,{
		height: rem(2)
	}),

	headerButtonLabel: {
		fontSize: rem(0.9),
		padding: '0 0.5rem 0 0'
	},

	headerButtonIcon: {
		fontSize: rem(1)
	},

	listContainer: makeStyle(FlexColumn,FlexScale, {
		overflow: 'hidden'
	})



}

/**
 * IRepoDrawerProps
 */
export interface IRepoPanelProps {
	theme?:any
}

function mapStateToProps(state) {
	return {
		theme: getTheme()
	}
}



/**
 * RepoDrawer
 *
 * @class RepoDrawer
 * @constructor
 **/
@connect(mapStateToProps)
@Radium
export class RepoPanel extends React.Component<IRepoPanelProps,any> {

	constructor(props, context) {
		super(props, context)
	}


	onBlur = () => repoActions.clearSelectedRepos()
	//onLogout = () => authActions.logout()
	onAddRepo = () => log.info('add repo here')

	keyHandlers = {

	}

	render() {
		const
			{theme} = this.props,
			{repoPanel:themeStyle} = theme,
			s = mergeStyles(styles,themeStyle),
			panelStyle = makeStyle(styles.panel,themeStyle.root),
			drawerStyle = makeStyle(styles.drawer,themeStyle.root),
			headerStyle = makeStyle(styles.header,themeStyle.header),
			headerButtonStyle = makeStyle(styles.headerButton,themeStyle.headerButton,{
				':hover': themeStyle.headerButtonHover
			})

		return (
			<HotKeys handlers={this.keyHandlers} style={styles.drawerWrapper} onBlur={this.onBlur}>
				<div style={panelStyle}>
					<div style={headerStyle}>
						<div style={s.headerTitle}>Repositories</div>
						<Button style={headerButtonStyle} onClick={this.onAddRepo}>
							<Icon style={styles.headerButtonIcon} iconSet='fa' iconName='plus'/>
						</Button>
						{/*<Button style={headerButtonStyle} onClick={this.onLogout}>*/}
							{/*<Icon style={styles.headerButtonIcon} iconSet='fa' iconName='sign-out'></Icon>*/}
						{/*</Button>*/}
					</div>
					<div style={styles.listContainer}>
						<RepoList />
					</div>
				</div>
			</HotKeys>
		)

	}

}
