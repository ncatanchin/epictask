

import {FontBlack} from 'shared/themes/styles/CommonStyles'
import {IGithubValidationError, GithubErrorCodes} from 'shared/GitHubClient'


export function repoName(repo,style = {}) {
	if (!repo || !repo.full_name)
		return <div>No repo</div>

	const parts = repo.full_name.split('/')
	return <div style={makeStyle(Ellipsis,style)}>
		<span>{parts[0]}/</span>
		<span style={FontBlack}>{parts[1]}</span>
	</div>
}

export function getGithubErrorText(saveError,field:string) {
	const
		validationErr:IGithubValidationError =
			!saveError ? null : saveError.errors
				.find(err => err.field === 'title')

	return !validationErr ? null : GithubErrorCodes[validationErr.code]
}