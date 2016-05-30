/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {TRepoState,RepoActionFactory} from 'epictask/app/actions'
import {RepoList} from './'
import {Drawer} from 'material-ui'

// Constants
const log = getLogger(__filename)
const styles = require("./RepoPanel.css")
const repoActions = new RepoActionFactory()
import { connect } from 'react-redux'
import {Themeable} from '../../ThemeManager'

/**
 * IRepoDrawerProps
 */
export interface IRepoPanelProps {
	repoState?: TRepoState,
	theme?:any
}

function mapStateToProps(state) {
	return {
		repoState: repoActions.state
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

		return (
		<Drawer docked={true} containerStyle={{position:'relative'}} className={styles.panel} containerClassName={styles.drawer}>
			<div styleName="header">
				header controls here
			</div>
			<div styleName="list-container">
				<RepoList repos={state.repos} repo={state.repo} styleName="list"/>
			</div>
		</Drawer>

		)

	}

}