

import {FontBlack} from 'shared/themes/styles'
import {IGithubValidationError, GithubErrorCodes} from 'shared/GitHubClient'

import { ThemedStyles, IThemedAttributes } from "shared/themes/ThemeDecorations"
import { CommandAccelerator } from "shared/commands"


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


/*
 HTML Entity     GLYPH  NAME
 &#63743;              Apple
 &#8984;         ⌘      Command, Cmd, Clover, (formerly) Apple
 &#8963;         ⌃      Control, Ctl, Ctrl
 &#8997;         ⌥      Option, Opt, (Windows) Alt
 &#8679;         ⇧      Shift
 &#8682;         ⇪      Caps lock
 &#9167;         ⏏      Eject
 &#8617;         ↩      Return, Carriage Return
 &#8629; &crarr; ↵      Return, Carriage Return
 &#9166;         ⏎      Return, Carriage Return
 &#8996;         ⌤      Enter
 &#9003;         ⌫      Delete, Backspace
 &#8998;         ⌦      Forward Delete
 &#9099;         ⎋      Escape, Esc
 &#8594; &rarr;  →      Right arrow
 &#8592; &larr;  ←      Left arrow
 &#8593; &uarr;  ↑      Up arrow
 &#8595; &darr;  ↓      Down arrow
 &#8670;         ⇞      Page Up, PgUp
 &#8671;         ⇟      Page Down, PgDn
 &#8598;         ↖      Home
 &#8600;         ↘      End
 &#8999;         ⌧      Clear
 &#8677;         ⇥      Tab, Tab Right, Horizontal Tab
 &#8676;         ⇤      Shift Tab, Tab Left, Back-tab
 &#9250;         ␢      Space, Blank
 &#9251;         **␣**  Space, Blank
 */


const kbdBaseStyles = (topStyles,theme,palette) => {
	
	return [FlexRowCenter,PositionRelative,{
		
		
	}]
}


export interface IKeyboardAcceleratorProps extends IThemedAttributes {
	accelerator:CommandAccelerator
	separator?:string
}

export const KeyboardAccelerator = ThemedStyles(kbdBaseStyles)((props:IKeyboardAcceleratorProps) => {
	
	const
		{style,separator = "+",styles} = props,
		accel = props.accelerator,
		parts = []
	
	if (accel.metaKey)
		parts.push(Env.isMac ? '⌘' : 'Win')
	
	if (accel.altKey)
		parts.push(Env.isMac ? '⌥' : 'Alt')
	
	if (accel.shiftKey)
		parts.push('⇧')
	
	if (accel.ctrlKey)
		parts.push('^')
	
	parts.push(...accel.codes.map(code => code.toUpperCase()))
	
	
	return <div style={makeStyle(styles,style)}>{parts.map((part,index) =>
		<div key={index}>
			{part}
			{/*<kbd ></kbd>*/}
			
			{index + 1 < parts.length && <span>&nbsp;</span>}
			
			{(separator && separator.length && index + 1 < parts.length) &&
				<span>+&nbsp;</span>
			}
		</div>)
	}</div>
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