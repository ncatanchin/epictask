/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {TRepoState,RepoActionFactory,AppActionFactory} from 'app/actions'
import {RepoList,MIcon} from 'components'
import {Drawer,RaisedButton} from 'material-ui'

// Constants
const log = getLogger(__filename)
//const styles = require("./RepoPanel.css")
const repoActions = new RepoActionFactory()
const appActions = new AppActionFactory()
import { connect } from 'react-redux'
import {Themeable} from 'app/ThemeManager'
import {makeStyle,rem,FlexColumn,FlexScale,FlexAuto,FlexAlignEnd,FlexRow,Ellipsis,FlexRowCenter,FlexColumnCenter,Fill,FillWidth,makeTransition} from 'app/themes'

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

	header: makeStyle(Ellipsis,FlexRow,FlexAuto,FlexAlignEnd),

	headerButton: makeStyle(FlexRowCenter,FillWidth,{
		height: rem(2)
	}),

	headerButtonLabel: {
		fontSize: rem(0.9)
	},

	headerButtonIcon: {
		fontSize: rem(1)
	},

	listContainer: makeStyle(FlexColumn,FlexScale, {
		overflow: 'hidden'
	}),

	list: makeStyle(FlexColumn,FlexScale, {
		overflowY: 'auto'
	})

}

/**
 * IRepoDrawerProps
 */
export interface IRepoPanelProps {
	repoState?: TRepoState,
	theme?:any
}

function mapStateToProps(state) {
	return {
		repoState: repoActions.state,
		theme: appActions.state.theme
	}
}


/**
 * RepoDrawer
 *
 * @class RepoDrawer
 * @constructor
 **/
@connect(mapStateToProps)
@Themeable()
@CSSModules(styles)
export class RepoPanel extends React.Component<IRepoPanelProps,TRepoState> {

	constructor(props, context) {
		super(props, context)
	}


	componentDidUpdate() {
		log.info('Component updated')
	}


	render() {
		const state = this.props.repoState || ({} as any)
		const theme = this.props.theme
		const {palette:p,repoPanel:{headerStyle}} = theme



		return (
			<div style={styles.drawerWrapper}>
				<Drawer docked={true} zIndex={2} containerStyle={styles.drawer} style={styles.panel}>
					<div style={makeStyle(styles.header,headerStyle)}>
						<RaisedButton
							backgroundColor={p.accent4Color}
							style={styles.headerButton}
							labelColor={p.textColor}
							labelPosition='before'
							label=""
							fullWidth={true}
							labelStyle={styles.headerButtonLabel}
							icon={<MIcon extraStyle={styles.headerButtonIcon}>add</MIcon>}
							>
						</RaisedButton>
					</div>
					<div style={styles.listContainer}>
						<RepoList repos={state.repos} availableRepos={state.availableRepos} selectedRepo={state.repo} style={styles.list}/>
					</div>
				</Drawer>
			</div>
		)

	}

}
