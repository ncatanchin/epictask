import * as React from "react"
import getLogger from "common/log/Logger"
import {
	CursorPointer,
	Fill,
	FillWidth,
	FlexAuto,
	FlexColumnCenter,
	FlexRowCenter,
	FlexScale,
	IThemedProperties, makeDimensionConstraints, makeMarginRem, makePaddingRem, mergeClasses,
	PositionRelative, rem,
	withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {VerticalSplitPane} from "renderer/components/elements/VerticalSplitPane"
import {IRepo} from "renderer/models/Repo"
import {AppActionFactory} from "renderer/store/actions/AppActionFactory"
import {IDataSet} from "common/Types"
import Header from "renderer/components/Header"
import RepoSelect from "renderer/components/elements/RepoSelect"
import {
	isSelectedRepoEnabledSelector,
	selectedOrgSelector,
	selectedRepoSelector
} from "renderer/store/selectors/DataSelectors"
import {IOrg} from "renderer/models/Org"
import {darken} from "@material-ui/core/styles/colorManipulator"
import {getValue} from "typeguard"
import Img from 'react-image'
import {IconButton, Typography} from "@material-ui/core"
import CheckIcon from "@material-ui/icons/Check"

import IssueList from "renderer/components/elements/IssueList"
import {userSelector} from "renderer/store/selectors/AppSelectors"
import {IUser} from "renderer/models/User"

const AvatarDefaultURL = require("renderer/assets/images/avatar-default.png")

const log = getLogger(__filename)

declare global {
	interface IIssuesLayoutStyles {
		colors: {
			bg: string
			controlsBg: string
			controlsBgHover: string
		}
	}
}


function baseStyles(theme:Theme):any {
	const
		{palette,components:{IssuesLayout}} = theme,
		{action,primary,secondary,background} = palette
	
	return {
		root: [Fill,FlexColumnCenter, {
			"&.enable": [{
				"& .repo": [makePaddingRem(0,1),{
					borderRadius: rem(0.5),
					background: IssuesLayout.colors.bg
				}],
				"& .button": [makeMarginRem(2),{
					"& .icon": [makeDimensionConstraints(rem(4)), {
						fontSize: rem(4)
					}]
				}]
			}]
		}],
		header: [FlexAuto],
		controls: [FlexRowCenter,FlexAuto,{
			background: IssuesLayout.colors.controlsBg,
			"& img": [makeDimensionConstraints(rem(2)), makePaddingRem(0)],
			"&:hover, &.open": [CursorPointer,{
				background: IssuesLayout.colors.controlsBgHover,
			}]
		}],
		content: [FlexScale, PositionRelative,FillWidth]
	}
}

export interface P extends IThemedProperties {
	header:Header
	repos?: IDataSet<IRepo>
	repo?: IRepo
	org?: IOrg
	user?: IUser
	isRepoEnabled?: boolean
}

export interface S {
	repoSelectOpen:boolean
}

@withStatefulStyles(baseStyles)
@connect(createStructuredSelector({
	repos: (state:IRootState) => state.DataState.repos,
	user: userSelector,
	repo: selectedRepoSelector,
	org: selectedOrgSelector,
	isRepoEnabled: isSelectedRepoEnabledSelector
}))
class Layout extends React.Component<P,S> {
	
	private actions = new AppActionFactory()
	
	constructor(props:P,context) {
		super(props,context)
		
		this.state = {
			repoSelectOpen: false
		}
	}
	
	private onRepoSelection = (repo:IRepo) => {
		log.info("Repo selected", repo)
		this.actions.setSelectedRepo(repo)
	}
	
	private onRepoSelectOpen = (repoSelectOpen:boolean) => this.setState({
		repoSelectOpen
	})
	
	private updateControls = () =>
		this.props.header.setRightControls(
			<div className={mergeClasses(this.props.classes.controls,this.state.repoSelectOpen && "open")}>
				<RepoSelect onOpen={this.onRepoSelectOpen} onSelection={this.onRepoSelection} value={this.props.repo}/>
				<Img
					src={getValue(() => this.props.user.avatar_url)}
					loader={<img src={AvatarDefaultURL}/>}
				/>
				{/*<Img*/}
					{/*src={getValue(() => this.props.repo.owner.avatar_url)}*/}
					{/*loader={<img src={AvatarDefaultURL}/>}*/}
				{/*/>*/}
				{/*<OrgSelect onSelection={this.onOrgSelection} value={this.props.selectedOrg}/>*/}
			</div>
		)
	
	private onEnableRepo = () => this.actions.enableRepo(this.props.repo)
	
	componentDidMount():void {
		this.updateControls()
	}
	
	componentDidUpdate(prevProps:Readonly<P>, prevState:Readonly<S>, snapshot?:any):void {
		this.updateControls()
	}
	
	renderSelectRepo():JSX.Element {
		const {classes} = this.props
		return <div className={classes.root}>
			<Typography variant="h2">Select a repository to start</Typography>
		</div>
	}
	
	renderRepoIsNotEnabled():JSX.Element {
		const {classes,repo} = this.props
		return <div className={mergeClasses(classes.root,"enable")}>
			<Typography variant="h2">Enable <span className="repo">{repo.full_name}</span>?</Typography>
			<IconButton className="button" onClick={this.onEnableRepo}>
				<CheckIcon className="icon"/>
			</IconButton>
		</div>
	}
	
	renderIssues():JSX.Element {
		const {classes} = this.props
		return <div className={classes.root}>
			<div className={classes.content}>
				<VerticalSplitPane  defaultSize={"50%"} minSize={400}>
					<IssueList/>
					<div>pane2</div>
				</VerticalSplitPane>
			</div>
		</div>
	}
	
	render() {
		const {classes,repo, isRepoEnabled} = this.props
		
		return !repo ? this.renderSelectRepo() :
			!isRepoEnabled ? this.renderRepoIsNotEnabled() :
				this.renderIssues()
	}
}

export default Layout
