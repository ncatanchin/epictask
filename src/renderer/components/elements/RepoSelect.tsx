import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, StyleDeclaration, withStatefulStyles} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {IRepo} from "renderer/models/Repo"
import AutoCompleteSelect from "renderer/components/elements/AutoCompleteSelect"
import {selectedOrgReposSelector} from "renderer/store/selectors/DataSelectors"

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
	value:IRepo
	repos?:Array<IRepo>
}

@withStatefulStyles(baseStyles)
@connect(createStructuredSelector({
	repos: selectedOrgReposSelector
}))
export default class RepoSelect extends React.Component<P> {
	
	constructor(props:P) {
		super(props)
	}
	
	
	render() {
		const {
			classes,
			repos,
			value
		} = this.props
		return <AutoCompleteSelect
			options={repos}
			onSelection={this.props.onSelection}
			idGetter={(value:IRepo) => value.id.toString(10)}
			labelGetter={(value:IRepo) => value.full_name}
			value={value}
		/>
	}
}
