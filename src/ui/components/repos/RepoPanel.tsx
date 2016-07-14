

/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import {Container} from 'typescript-ioc'
import * as React from 'react'
import { connect } from 'react-redux'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {RepoList,Icon,Button} from 'components'
import {Dialogs} from 'shared/Constants'
import * as Radium from 'radium'

// Key mapping tools
import * as KeyMaps from 'shared/KeyMaps'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
const {CommonKeys:Keys} = KeyMaps
const {HotKeys} = require('react-hotkeys')

// Constants
const log = getLogger(__filename)




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
 * RepoPanel
 *
 * @class RepoPanel
 * @constructor
 **/

@connect(mapStateToProps)
@Radium
export class RepoPanel extends React.Component<IRepoPanelProps,any> {


	repoActions:RepoActionFactory = Container.get(RepoActionFactory)
	uiActions = Container.get(UIActionFactory)

	onAddRepoButtonFocus = (event:React.MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
	}

	onBlur = () => {
		this.repoActions.clearSelectedRepos()
	}

	onAddRepoClicked = (event:React.MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()

		log.debug(`add repo click`,event)

		this.uiActions.showAddRepoDialog()

	}

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
			<HotKeys handlers={this.keyHandlers} style={styles.drawerWrapper}>
				<div style={panelStyle}>
					<div style={headerStyle}>
						<div style={s.headerTitle}>Repositories</div>
						<Button tabIndex={-1} style={headerButtonStyle} onFocus={this.onAddRepoButtonFocus} onClick={this.onAddRepoClicked}>
							<Icon style={styles.headerButtonIcon} iconSet='fa' iconName='plus'/>
						</Button>
					</div>
					<div style={styles.listContainer}>
						<RepoList />
					</div>
				</div>
			</HotKeys>
		)

	}

}
