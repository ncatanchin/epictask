import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, StyleDeclaration, withStatefulStyles} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {IRepo} from "renderer/models/Repo"
import AutoCompleteSelect from "renderer/components/elements/AutoCompleteSelect"
import {selectedOrgReposSelector} from "renderer/store/selectors/DataSelectors"
import * as _ from 'lodash'
import {guard} from "typeguard"
const log = getLogger(__filename)


function baseStyles(theme):StyleDeclaration {
	const
		{palette} = theme,
		{primary, secondary} = palette
	
	return {
		root: []
	}
}

interface P extends IThemedProperties {
	onSelection: (repo:IRepo) => void
	onOpen?:(open:boolean) => void
	value:IRepo
	repos?:Array<IRepo>
}

interface S {
	open: boolean
}

@withStatefulStyles(baseStyles, {withTheme: true})
@connect(createStructuredSelector({
	repos: selectedOrgReposSelector
}))
export default class RepoSelect extends React.Component<P,S> {
	
	constructor(props:P) {
		super(props)
		
		this.state = {
			open: false
		}
	}
	
	private makeOpenHandler = (open:boolean) => () => this.setState({
		open
	}, () => guard(() => this.props.onOpen(open)))
	
	render() {
		const {
			classes,
			repos,
			value,
			theme
		} = this.props
		return <AutoCompleteSelect
			options={repos}
			onSelection={this.props.onSelection}
			idGetter={(value:IRepo) => value.id.toString(10)}
			labelGetter={(value:IRepo) => value.full_name}
			value={value}
			onMenuOpen={this.makeOpenHandler(true)}
			onMenuClose={this.makeOpenHandler(false)}
			styles={{
				input: (base,state,...other) => {
					//log.info("Input base", base, state,other)
					return {
						...base,
						color: theme.palette.primary.contrastText
					}
				},
				menuPortal: (base,state) => {
					//log.info("Portal base", base, state)
					return {
						..._.omit(base,'width','left'),
						right: window.innerWidth - base.left - base.width,
						minWidth: base.width,
						maxWidth: "40vw",
						zIndex: 9999,
					}
				}
			}}
			
		/>
		
	}
}
