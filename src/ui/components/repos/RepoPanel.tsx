

/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import {createStructuredSelector} from 'reselect'
import {Container} from 'typescript-ioc'
import * as React from 'react'
import { connect } from 'react-redux'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {RepoList,Icon,Button} from 'components'


// Key mapping tools
import * as KeyMaps from 'shared/KeyMaps'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {PureRender} from 'ui/components/common/PureRender'
import * as Radium from 'radium'
import {IToolProps} from "ui/components/ToolPanel"
const {CommonKeys:Keys} = KeyMaps
const {HotKeys} = require('react-hotkeys')


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

	drawerControl: [makeTransition(['opacity']),FlexColumnCenter,PositionAbsolute,{
		opacity: 0,
		pointerEvents: 'none',
		textAlign: 'center',
		width: rem(2),
		padding: 0,

		visible: {
			opacity: 1,
			pointerEvents: 'auto',
			zIndex: 9999
		},

		// Arrow Button
		button: {
			padding: "0.5rem 0.3rem",
			width: rem(2),
			height: rem(2)
		},

		// "Repo" label
		label: {
			textOrientation: "sideways-right",
			writingMode: "vertical-lr",
			transform: "rotate(0.5turn)",
			padding: "0.5rem 0.3rem",
			fontSize: rem(0.9)
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

@ThemedStyles(baseStyles,'repoPanel')
@Radium
@HotKeyContext()
@PureRender
export class RepoPanel extends React.Component<IRepoPanelProps,any> {


	repoActions:RepoActionFactory = Container.get(RepoActionFactory)
	uiActions = Container.get(UIActionFactory)

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
			{theme,toolState,styles,open} = this.props,
			
			panelStyle = [
				styles.panel,
				styles.root,
				!open ? styles.panel.closed : {}
			],

			drawerControlStyle = makeStyle(
				styles.drawerControl,
				!open && styles.drawerControl.visible
			),

			drawerWrapperStyle = [
				styles.drawerWrapper,
				!open && styles.drawerWrapper.closed
			],

			drawerStyle = [styles.drawer,styles.root],

			headerStyle = [styles.header],

			headerButtonStyle = [styles.headerButton]


		return <div style={drawerWrapperStyle}>
			<Button tabIndex={-1} style={drawerControlStyle} onClick={(e) => this.setRepoPanelOpen(e,true)}>
				<Icon style={makeStyle(styles.headerButtonIcon,styles.drawerControl.button)} iconSet='fa' iconName='chevron-right'/>
				<div style={styles.drawerControl.label}>
					Repos
				</div>
			</Button>

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
