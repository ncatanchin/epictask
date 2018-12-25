import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, mergeClasses, StyleDeclaration, withStatefulStyles} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"


const log = getLogger(__filename)


function baseStyles(theme):StyleDeclaration {
	const
		{palette} = theme,
		{primary, secondary} = palette
	
	return {
		/* Shadow 0dp */
		elevation0: {boxShadow: "none"},
	
	/* Shadow 2dp */
		elevation2: {boxShadow: "0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20)"},
	
	
	/* Shadow 4dp */
		elevation4: {boxShadow: "0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.20)"},
	
	/* Shadow 6dp */
		elevation6: {boxShadow: "0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12), 0 3px 5px -1px rgba(0,0,0,0.20)"},
	
	/* Shadow 8dp */
		elevation8: {boxShadow: "0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.20)"},
	
	/* Shadow 9dp */
		elevation9: {boxShadow: "0 9px 12px 1px rgba(0,0,0,0.14), 0 3px 16px 2px rgba(0,0,0,0.12), 0 5px 6px -3px rgba(0,0,0,0.20)"},
	
	/* Shadow 12dp */
		elevation12: {boxShadow: "0 12px 17px 2px rgba(0,0,0,0.14), 0 5px 22px 4px rgba(0,0,0,0.12), 0 7px 8px -4px rgba(0,0,0,0.20)"},
	
	/* Shadow 16dp */
		elevation16: {boxShadow: "0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.20)"},
	
	/* Shadow 24dp */
		elevation24: {boxShadow: "0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.20)"}
	}
}

interface P extends IThemedProperties {
	elevation: 0 | 2 | 4 | 6 | 8 | 9 | 12 | 16 | 24
}

@withStatefulStyles(baseStyles)
export default class Elevation extends React.Component<P> {
	
	constructor(props:P) {
		super(props)
	}
	
	render() {
		const {classes,className,elevation,...props} = this.props
		return <div className={mergeClasses(classes[`elevation${elevation}`],className)}>
			{props.children}
		</div>
	}
}
