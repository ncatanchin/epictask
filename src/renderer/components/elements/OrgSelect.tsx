import * as React from "react"
import getLogger from "common/log/Logger"
import {
	Ellipsis, FillWidth, FlexAuto,
	FlexColumnCenter, FlexRowCenter, FlexScale,
	IThemedProperties,
	makeDimensionConstraints, makeHeightConstraint, makeMarginRem, makePaddingRem, makeWidthConstraint, rem,
	StyleDeclaration,
	withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {IOrg} from "common/models/Org"
import Img from 'react-image'
import {guard} from "typeguard"
import Button from "@material-ui/core/Button"
import Popper from "@material-ui/core/Popper"

import Paper from "@material-ui/core/Paper"
import ClickAwayListener from "@material-ui/core/ClickAwayListener"
import MenuList from "@material-ui/core/MenuList"
import MenuItem from "@material-ui/core/MenuItem"
import {darken} from "@material-ui/core/styles/colorManipulator"
import Elevation from "renderer/components/elements/Elevation"

const Grow = require("@material-ui/core/Grow").default
const AvatarDefaultURL = require("renderer/assets/images/avatar-default.png")
const log = getLogger(__filename)


function baseStyles(theme):StyleDeclaration {
	const
		{palette} = theme,
		{primary, secondary} = palette,
		listBorder = `${rem(0.1)} ${darken(primary.dark,0.5)} solid`
	
	return {
		root: [{
			"& > .button": [makeDimensionConstraints(rem(2)), makePaddingRem(0), {
				"& img": [makeDimensionConstraints(rem(2))],
				//backgroundColor: darken(primary.dark,0.2)
			}]
		}],
		
		listContainer: [makePaddingRem(0),makeMarginRem(0),{
			backgroundColor: darken(primary.dark,0.7),
			"& .list": [FlexColumnCenter, {
				maxWidth: "20vw",
				alignItems: 'flex-end',
				borderTop: listBorder,
				borderLeft: listBorder,
				borderRight: listBorder,
				"&,& *": { cursor: 'pointer' },
				"& .item":[makeHeightConstraint(rem(3)),FlexRowCenter,{
					alignSelf: 'stretch',
					justifyContent: 'flex-end',
					cursor: 'pointer',
					
					"& .img": [makeDimensionConstraints(rem(3)),FlexAuto,makePaddingRem(0.5),{
						backgroundColor: darken(primary.dark,0.5),
					}],
					
					"& .label": [FlexScale, Ellipsis,makePaddingRem(0.5),{
						color: primary.contrastText,
						textAlign: 'right'
					}],
					
					"&:hover": {
						backgroundColor: darken(primary.dark,0.4),
						"&,& *": { cursor: 'pointer' },
					}
				}]
			}]
		}]
	} as any
}

interface P extends IThemedProperties {
	orgs?: Array<IOrg>
	value: IOrg
	onSelection: (org:IOrg) => void
}

interface S {
	open: boolean
}

@withStatefulStyles(baseStyles)
@connect(createStructuredSelector({
	orgs: (state:IRootState) => state.DataState.orgs.data
}))
export default class OrgSelect extends React.Component<P, S> {
	
	private buttonRef = React.createRef()
	
	constructor(props:P) {
		super(props)
		
		this.state = {
			open: false
		}
	}
	
	private onToggle = () => this.setState({
		open: !this.state.open
	})
	
	private onClose = () => this.setState({
		open: false
	})
	
	private makeOnSelect(org:IOrg):() => void {
		return () => {
			guard(() => this.props.onSelection(org))
			this.onClose()
		}
	}
	
	render() {
		const
			{classes, value, orgs} = this.props,
			{open} = this.state
		
		return <div className={classes.root}>
			{!!value && !!orgs &&
			<>
			<Button
				buttonRef={this.buttonRef}
				onClick={this.onToggle} className="button"
				aria-owns={open ? 'menu-list-grow' : undefined}
				aria-haspopup="true"
			>
				<Img
					src={value.avatar_url}
					loader={<img src={AvatarDefaultURL}/>}
				/>
			</Button>
			<Popper open={open} anchorEl={this.buttonRef.current as any} transition>
				{({ TransitionProps, placement }) => (
					<Grow
						{...TransitionProps}
						id="menu-list-grow"
						style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
					>
						<Elevation elevation={4} className={classes.listContainer}>
							<ClickAwayListener onClickAway={this.onClose}>
								<div className="list">
									{orgs.map(org =>
										<div key={org.id} className="item" onClick={this.makeOnSelect(org)}>
											<div className="label" >{org.login}</div>
											<Img
												className="img"
												src={org.avatar_url}
												loader={<img src={AvatarDefaultURL}/>}
											/>
										</div>
									)}
								</div>
							</ClickAwayListener>
						</Elevation>
					</Grow>
				)}
			</Popper>
			</>
			}
		</div>
	}
}
