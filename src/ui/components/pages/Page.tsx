import * as React from 'react'
import filterProps from 'react-valid-props'

const log = getLogger(__filename)

const styles = {
	page: makeStyle(FlexRowCenter,FlexScale,PositionRelative,{
		overflow: 'hidden'
	})
}

export interface IPageProps extends React.HTMLAttributes {
	onResize?:Function
}

export class Page extends React.Component<IPageProps,any> {


	onResize = (event) => (this.props.onResize && this.props.onResize(event))

	componentWillMount() {
		window.addEventListener('resize',this.onResize)
	}

	componentWillUnmount() {
		window.removeEventListener('resize',this.onResize)
	}

	render() {

		let {style} = this.props
		const pageStyle = makeStyle(styles.page,style)

		return <div {...filterProps(this.props)} style={pageStyle}>
			{this.props.children}
		</div>
	}


}