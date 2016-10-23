import {getTheme} from "shared/themes/ThemeManager"
import {FlexScale} from "shared/themes/styles/CommonStyles"



export const ContentRoot = (props) => (
	<div className='fill-height fill-width root-content'
	     style={makeStyle(FlexScale,getTheme().app)}>
		{props.children}
	</div>
)