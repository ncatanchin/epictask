

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
import {Themed} from 'shared/themes/ThemeManager'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {PureRender} from 'ui/components/common/PureRender'
import * as Radium from 'radium'
const {CommonKeys:Keys} = KeyMaps
const {HotKeys} = require('react-hotkeys')

// Constants
const log = getLogger(__filename)

const styles:any = createStyles({
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
export interface IRepoPanelProps {
	theme?:any
	repoPanelOpen?:boolean
}

const mapStateToProps = createStructuredSelector({
	repoPanelOpen: (state) => uiStateSelector(state).repoPanelOpen
},createDeepEqualSelector)



/**
 * RepoPanel
 *
 * @class RepoPanel
 * @constructor
 **/
@Radium
@connect(mapStateToProps)
@Themed
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
			{theme,repoPanelOpen} = this.props,
			{repoPanel:themeStyle} = theme,
			s = mergeStyles(styles,themeStyle),

			panelStyle = makeStyle(
				styles.panel,
				themeStyle.root,
				!repoPanelOpen ? styles.panel.closed : {}
			),

			drawerControlStyle = makeStyle(
				styles.drawerControl,
				themeStyle.drawerControl,
				!repoPanelOpen && styles.drawerControl.visible
			),

			drawerWrapperStyle = makeStyle(
				styles.drawerWrapper,
				!repoPanelOpen && styles.drawerWrapper.closed
			),

			drawerStyle = makeStyle(styles.drawer,themeStyle.root),

			headerStyle = makeStyle(styles.header,themeStyle.header),

			headerButtonStyle = makeStyle(styles.headerButton,themeStyle.headerButton,{
				':hover': themeStyle.headerButtonHover
			})


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
					<div style={s.headerTitle}>Repositories</div>
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
