

import {FontBlack} from '../../styles/CommonStyles'

export function repoName(repo,style = {}) {
	if (!repo || !repo.full_name)
		return <div>No repo</div>

	const parts = repo.full_name.split('/')
	return <div style={makeStyle(Ellipsis,style)}>
		<span>{parts[0]}/</span>
		<span style={FontBlack}>{parts[1]}</span>
	</div>
}