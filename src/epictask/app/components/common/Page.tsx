import * as React from 'react'

const log = getLogger(__filename)
const styles = require('./Page.css')

@CSSModules(styles)
export class Page extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}



	render() {
		return <div styleName="page">
			{this.props.children}
		</div>
	}


}