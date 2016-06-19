const log = getLogger(__filename)

import * as React from 'react'
import {AuthActionFactory} from 'shared/actions'
import {CircularProgress} from 'material-ui'
import {Page} from './'

const authActions = new AuthActionFactory()

const styles = {
	page: makeStyle(FlexColumnCenter,FlexScale,{
		WebkitAppRegion: 'drag'
	}),

	panel: makeStyle(FlexAuto,{

	})
}

/**
 * The root container for the app
 */
export class VerifyLoginPage extends React.Component<any,any> {


	render() {
		const theme = getTheme()
		const {palette} = theme
		const pageStyle = makeStyle(styles.page,{
			backgroundColor: palette.accent4Color,
			color: palette.accent4ColorText
		})

		return (
			<Page style={pageStyle}>
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<div style={styles.panel}>
					<CircularProgress size={2} />
				</div>
			</Page>
		)
	}
}


