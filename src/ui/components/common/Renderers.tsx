

import {FontBlack} from 'shared/themes/styles/CommonStyles'
import {IGithubValidationError, GithubErrorCodes} from 'shared/GitHubClient'
import * as Radium from "radium"
import { ThemedStyles } from "shared/themes/ThemeDecorations"


const repoBaseStyles = (topStyles,theme,palette) => {
	
	return [FlexRow,PositionRelative,{
		fontSize: themeFontSize(1.2),
		//height: rem(2),
		
		text: [FlexRowCenter,FillHeight,{
			
		}]
	}]
}

/**
 * Format repo name
 *
 * @param repo
 * @param style
 * @returns {any}
 */
export const RepoName = ThemedStyles(repoBaseStyles)(({repo,styles = {} as any,style = {}}) => {
	if (!repo || !repo.full_name)
		return <div>No repo</div>

	const
		parts = repo.full_name.split('/')
	return <div style={[styles,style]}>
		<div style={styles.text}>{parts[0]}</div>
		<div style={styles.text}>/</div>
		<div style={[styles.text,FontBlack]}>{parts[1]}</div>
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