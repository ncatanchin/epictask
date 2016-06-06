import * as React from 'react'
const log = getLogger(__filename)

import {RaisedButton,FontIcon} from 'material-ui'
import {AuthActionFactory} from '../../actions/auth/AuthActionFactory'
import {Page} from '../common'

const styles = {
	page: makeStyle(FlexColumnCenter,FlexScale,{
		WebkitAppRegion: 'drag'
	}),
	
	panel: makeStyle(FlexAuto,{
		
	})
}

const authActions = new AuthActionFactory()

/**
 * The root container for the app
 */
export class LoginPage extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}


	render() {
		const theme = getTheme()
		const {palette} = theme
		const pageStyle = makeStyle(styles.page,{
			backgroundColor: palette.accent4Color,
			color: palette.accent4ColorText
		})
		
		return (
			<Page style={pageStyle} id='loginPage'>
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<div style={styles.panel}>
					<RaisedButton
						label="Authenticate GitHub"
						primary={true}
						onClick={() => authActions.authenticate()}
						icon={<FontIcon className="fa fa-github" />}
					/>

				</div>
			</Page>
		)
	}
}


