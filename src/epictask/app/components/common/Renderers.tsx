

import {FontBlack} from '../../styles/CommonStyles'

export function repoName(repo) {
	const parts = repo.full_name.split('/')
	return [<span>{parts[0]}/</span>,<span style={FontBlack}>{parts[1]}</span>]
}