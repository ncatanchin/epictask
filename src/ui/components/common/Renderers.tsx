

import {FontBlack} from 'shared/themes/styles/CommonStyles'
import {IGithubValidationError, GithubErrorCodes} from 'shared/GitHubClient'
import * as Radium from "radium"

/**
 * Format repo name
 *
 * @param repo
 * @param style
 * @returns {any}
 */
export const RepoName = Radium(({repo,style = {}}) => {
	if (!repo || !repo.full_name)
		return <div>No repo</div>

	const parts = repo.full_name.split('/')
	return <div style={style}>
		<span>{parts[0]}/</span>
		<span style={FontBlack}>{parts[1]}</span>
	</div>
})

/**
 * Get git hub error text
 *
 * @param saveError
 * @param field
 * @returns {null}
 */
export function getGithubErrorText(saveError,field:string) {
	const
		errors = _.get(saveError,'errors',[]),
		validationErr:IGithubValidationError = errors
			.find(err => err.field === 'title')

	return !validationErr ? null : GithubErrorCodes[validationErr.code]
}