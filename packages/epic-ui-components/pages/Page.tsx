import * as React from 'react'
import filterProps from 'react-valid-props'
import { IThemedAttributes, ThemedStyles } from "epic-styles"
import { PureRender } from "epic-ui-components"

const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
	page: makeStyle(FlexRowCenter,FlexScale,PositionRelative,{
		overflow: 'hidden'
	})
})

export interface IPageProps {
	onResize?:Function
	style?:any
	styles?:any
	id?:string
}

@ThemedStyles(baseStyles)
@PureRender
export class Page extends React.Component<IPageProps,any> {


	onResize = (event) => (this.props.onResize && this.props.onResize(event))

	componentWillMount() {
		window.addEventListener('resize',this.onResize)
	}

	componentWillUnmount() {
		window.removeEventListener('resize',this.onResize)
	}

	render() {

		let
			{style,styles} = this.props
		
		const
			pageStyle = makeStyle(styles.page,style)

		return <div {...filterProps(this.props)} style={pageStyle}>
			{this.props.children}
		</div>
	}


}