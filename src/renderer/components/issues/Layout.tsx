import * as React from "react"
import getLogger from "common/log/Logger"
import {
	CursorPointer,
	Fill, FillWidth, FlexAuto,
	FlexColumnCenter, FlexRowCenter, FlexScale,
	IThemedProperties, PositionRelative,
	StyleDeclaration,
	withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import SplitPane from "react-split-pane"
import {hot} from "react-hot-loader"
import {VerticalSplitPane} from "renderer/components/elements/VerticalSplitPane"
import {IRepo} from "renderer/models/Repo"
import {AppActionFactory} from "renderer/store/actions/AppActionFactory"
import {HeaderContext} from "renderer/components/Context"
import {IDataSet} from "common/Types"
import Header from "renderer/components/Header"
import RepoSelect from "renderer/components/elements/RepoSelect"
import {selectedOrgSelector, selectedRepoSelector} from "renderer/store/selectors/DataSelectors"
import {IOrg} from "renderer/models/Org"
import OrgSelect from "renderer/components/elements/OrgSelect"
import {darken} from "@material-ui/core/styles/colorManipulator"


const log = getLogger(__filename)


function baseStyles(theme):any {
	const
		{palette} = theme,
		{action,primary,secondary} = palette
	
	return {
		root: [Fill,FlexColumnCenter],
		header: [FlexAuto],
		controls: [FlexRowCenter,FlexAuto,{
			backgroundColor: darken(primary.dark,0.3),
			
			"&:hover": [CursorPointer,{
				backgroundColor: action.main,
			}]
		}],
		content: [FlexScale, PositionRelative,FillWidth]
	}
}

export interface P extends IThemedProperties {
	header:Header
	repos?: IDataSet<IRepo>
	selectedRepo?: IRepo
	selectedOrg?: IOrg
}

export interface S {

}

@withStatefulStyles(baseStyles)
@connect(createStructuredSelector({
	repos: (state:IRootState) => state.DataState.repos,
	selectedRepo: selectedRepoSelector,
	selectedOrg: selectedOrgSelector
}))
class Layout extends React.Component<P,S> {
	
	private actions = new AppActionFactory()
	
	constructor(props:P,context) {
		super(props,context)
		
		this.state = {
		
		}
	}
	
	private onRepoSelection = (repo:IRepo) => {
		log.info("Repo selected", repo)
		this.actions.setSelectedRepo(repo)
	}
	
	private onOrgSelection = (org:IOrg) => {
		log.info("Org selected", org)
		this.actions.setSelectedOrg(org)
	}
	
	private updateControls = () =>
		this.props.header.setControls(
			<div className={this.props.classes.controls}>
				<RepoSelect onSelection={this.onRepoSelection} value={this.props.selectedRepo}/>
				<OrgSelect onSelection={this.onOrgSelection} value={this.props.selectedOrg}/>
			</div>
		)
	
	
	componentDidMount():void {
		this.updateControls()
	}
	
	componentDidUpdate(prevProps:Readonly<P>, prevState:Readonly<S>, snapshot?:any):void {
		this.updateControls()
	}
	
	render() {
		const {classes} = this.props
		return <div className={classes.root}>
			<div className={classes.content}>
				<VerticalSplitPane  defaultSize={"50%"} minSize={400}>
					<div>pane1</div>
					<div>pane2</div>
				</VerticalSplitPane>
			</div>
		</div>
	}
}

export default Layout
