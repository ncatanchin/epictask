import { ThemedStyles, IThemedAttributes } from "epic-styles"
const log = getLogger(__filename)

import * as React from 'react'

import {CircularProgress} from 'material-ui'
import {Page} from './Page'


const baseStyles = (topStyles,theme,palette) => ({
	page: makeStyle(FlexColumnCenter,FlexScale,{
		WebkitAppRegion: 'drag'
	}),

	panel: makeStyle(FlexAuto,{

	})
})

/**
 * The root container for the app
 */
@ThemedStyles(baseStyles)
export class VerifyLoginPage extends React.Component<IThemedAttributes,void> {

	render() {
		const
			{styles,palette} = this.props,
			pageStyle = makeStyle(styles.page,{
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


