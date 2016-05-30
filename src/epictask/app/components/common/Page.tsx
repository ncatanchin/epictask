import * as React from 'react'

const log = getLogger(__filename)
const {Flexbox,FlexItem} = require('flexbox-react')

@CSSModules(require('./Page.css'))
export class Page extends React.Component<any,any> {

	static getInitialState() {
		return {}
	}

	constructor(props = {}) {
		super(props)
	}

	componentWillMount() {
	}

	componentDidMount() {
	}

	componentWillUnmount() {
	}

	render() {
		return <div styleName="page">
			{this.props.children}
		</div>
	}


}