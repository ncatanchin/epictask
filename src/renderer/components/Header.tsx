import * as React from "react"
import getLogger from "common/log/Logger"
import {
	FillHeight,
	FillWidth, FlexAuto, FlexRowCenter, FlexScale,
	IThemedProperties, makeDimensionConstraints,
	makeHeightConstraint, makeTransition, makeWidthConstraint,
	mergeClasses, OverflowHidden, PositionAbsolute, PositionRelative, rem,
	StyleDeclaration,
	withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {AppActionFactory} from "renderer/store/actions/AppActionFactory"
import {darken} from "@material-ui/core/styles/colorManipulator"
import {WindowControls} from "renderer/components/elements/WindowControls"
import {guard} from "typeguard"
import CheckIcon from "@material-ui/icons/Check"

const log = getLogger(__filename)


function baseStyles(theme):StyleDeclaration {
	const
		{palette} = theme,
		{action, primary, secondary} = palette,
		bgColor = `content-box radial-gradient(${darken(primary.dark,0.6)}, ${darken(primary.dark, 0.7)})`
	return {
		root: [makeHeightConstraint(rem(2)),FillWidth,FlexRowCenter,PositionRelative,OverflowHidden,{
			background: bgColor,//darken(primary.dark,0.7),
			"& > .left, & > .right": [FlexRowCenter, FlexScale, FillHeight, {
			
			}],
			"& > .left": [{
				justifyContent: "flex-start"
			}],
			"& > .right": [{
				justifyContent: "flex-end"
			}],
			
			"&:hover > .logo .overlay": {
				boxShadow: "inset 0 0 0.6rem rgba(100,100,100,0.8)"
			},
			
			"& > .logo": [FlexAuto,FillHeight,PositionRelative,makeDimensionConstraints(rem(1.2)),{
				color: primary.contrastText,
				fontFamily: "FiraCode",
				"-webkit-user-select": "none",
				"-webkit-app-region": "drag",
				"&, & *, &:hover, &:hover *": {
					cursor: "move !important",
				},
				"& > .icon": [makeDimensionConstraints(rem(1.2)),{
					pointerEvents: "none",
					borderRadius: rem(0.6),
					backgroundColor: action.main
				}],
				"& > .overlay": [PositionAbsolute,makeTransition("box-shadow"),makeDimensionConstraints(rem(1.4)),{
					pointerEvents: "all",
					top: 0,
					left: 0,
					right:0,
					bottom:0,
					zIndex: 100,
					borderRadius: rem(0.6),
					boxShadow: "inset 0 0 0.4rem rgba(10,10,10,0.5)"
				}]
			}]
		}],
		
		
	} as any
}

interface P extends IThemedProperties {
	headerRef:(headerRef:Header) => void
}

interface S {
	controls: React.ReactFragment | React.Component<any> | JSX.Element | null
}

@withStatefulStyles(baseStyles)
@connect(createStructuredSelector({

}))
export default class Header extends React.Component<P, S> {
	
	private actions = new AppActionFactory()
	
	constructor(props:P) {
		super(props)
		
		this.state = {
			controls: null
		}
	}
	
	setControls(controls: React.ReactFragment | React.Component<any> | JSX.Element | null) {
		this.setState({controls})
	}
	
	componentDidMount():void {
		guard(() => this.props.headerRef(this))
	}
	
	
	render() {
		const
			{classes,className} = this.props,
			{controls} = this.state
		
		return <div className={mergeClasses(classes.root,className)}>
			
			<div className="left">
				<WindowControls />
			</div>
			
			<div className="logo">
				{/*<img  src={require("renderer/assets/images/logo.svg")}/>*/}
				<CheckIcon className="icon"/>
				<div className="overlay"/>
			</div>
			
			<div className="right">
				{controls}
			</div>
		</div>
	}
}

