import {getTheme} from "epic-styles"
import {FlexScale} from "epic-styles"



export const ContentRoot = (props) => (
	<div className='fill-height fill-width root-content'
	     style={makeStyle(FlexScale,getTheme().app)}>
		{props.children}
	</div>
)