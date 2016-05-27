import * as React from 'react'
import {RaisedButton,FontIcon} from 'material-ui'


const log = getLogger(__filename)
const {Flexbox,FlexItem} = require('flexbox-react')

const styles = require('./HomePage.css')

/**
 * The root container for the app
 */
export class HomePage extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}



	render() {

		return (
			<Flexbox flexDirection="row" justifyContent="center" minHeight="100vh" minWidth="100vw" styleName="homePage">
				{/*Login here, <Link to="/repos">Goto Repos</Link>*/}
				<FlexItem alignSelf="center">
					home

				</FlexItem>


			</Flexbox>
		)
	}
}


