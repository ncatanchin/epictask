import * as React from 'react'

const log = getLogger(__filename)

const styles = {
	page: makeStyle(FlexRowCenter,FlexScale,PositionRelative,{
		overflow: 'hidden'
	})
}

export class Page extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}



	render() {

		let {style} = this.props
		const pageStyle = makeStyle(styles.page,style)

		return <div {...this.props} style={pageStyle}>
			{this.props.children}
		</div>
	}


}