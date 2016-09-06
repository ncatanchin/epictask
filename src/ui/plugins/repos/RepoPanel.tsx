

// Imports
import {Container} from 'typescript-ioc'
import * as React from 'react'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Icon,Button,PureRender} from 'ui/components/common'
import {RepoList} from './RepoList'

// Key mapping tools
import * as KeyMaps from 'shared/KeyMaps'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import * as Radium from 'radium'

import {RegisterTool} from "shared/Registry"
import {DefaultTools} from "shared/Constants"
import {ToolPanelLocation,IToolProps} from "shared/tools/ToolTypes"
const
	{CommonKeys:Keys} = KeyMaps,
	{HotKeys} = require('react-hotkeys')


// Constants
const log = getLogger(__filename)

const baseStyles:any = createStyles({
	cover: makeStyle(FlexColumn,FlexScale,Fill,{

	}),

	panel: [makeTransition(['opacity']),FlexColumn,FlexScale,Fill,{
		opacity: 1,
		closed: {
			opacity: 0
		}
	}],

	
	drawerWrapper: [makeTransition(['width','minWidth','maxWidth']), FlexColumn,FlexScale,Fill,{
		minWidth: rem(20),
		position: 'relative',

		closed: {
			minWidth: rem(2.8),
			maxWidth: rem(2.8)
		}
	}],

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



})

/**
 * IRepoDrawerProps
 */
export interface IRepoPanelProps extends IToolProps {
	theme?:any
	styles?:any
}


/**
 * RepoPanel
 *
 * @class RepoPanel
 * @constructor
 **/


@HotKeyContext()
@ThemedStyles(baseStyles,'repoPanel')
@Radium
@PureRender
@RegisterTool()
export class RepoPanel extends React.Component<IRepoPanelProps,any> {
	
	/**
	 * Default location for the tool
	 *
	 * @type {ToolPanelLocation}
	 */
	static defaultLocation = ToolPanelLocation.Left
	
	static id = DefaultTools.RepoPanel
	
	static label = "Repos"
	
	private repoActions:RepoActionFactory = Container.get(RepoActionFactory)
	
	private uiActions = Container.get(UIActionFactory)

	setRepoPanelOpen = (event, open:boolean) => {
		this.uiActions.setRepoPanelOpen(open)
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
			{theme,config,styles,visible} = this.props,
			
			panelStyle = [
				styles.panel,
				styles.root,
				!open ? styles.panel.closed : {}
			],

			drawerControlStyle = makeStyle(
				styles.drawerControl,
				!visible && styles.drawerControl.visible
			),

			drawerWrapperStyle = [
				styles.drawerWrapper,
				!visible && styles.drawerWrapper.closed
			],

			drawerStyle = [styles.drawer,styles.root],

			headerStyle = [styles.header],

			headerButtonStyle = [styles.headerButton]


		return <div style={drawerWrapperStyle}>
			
			<HotKeys handlers={this.keyHandlers} style={panelStyle}>

				{/* Header controls */}
				<div style={headerStyle}>
					<div style={styles.headerTitle}>Repositories</div>
					<Button tabIndex={-1} style={headerButtonStyle} onClick={this.onAddRepoClicked}>
						<Icon style={styles.headerButtonIcon} iconSet='fa' iconName='plus'/>
					</Button>
					<Button tabIndex={-1} style={headerButtonStyle} onClick={(e) => this.setRepoPanelOpen(e,false)}>
						<Icon style={styles.headerButtonIcon} iconSet='fa' iconName='chevron-left'/>
					</Button>
				</div>

				{/* List */}
				<div style={styles.listContainer}>
					<RepoList />
				</div>

			</HotKeys>
		</div>


	}

}
