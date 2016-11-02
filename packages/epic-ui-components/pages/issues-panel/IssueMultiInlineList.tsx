// Imports

import { List } from "immutable"
import { RepoName, PureRender } from "../../common"
import { PositionRelative, ThemedStyles, IThemedAttributes, makeWidthConstraint } from "epic-styles"
import { Issue } from "epic-models"


// Constants
const log = getLogger(__filename)

function baseStyles(topStyles,theme,palette) {
	const
		{text,accent,primary,secondary,background} = palette
	
	return [{
		
		
		issues: [ PositionRelative,  makeWidthConstraint('70%'), makeMarginRem(0.5,0,1,0), OverflowAuto,{
			background,
			maxHeight: '35%'
		} ],
		
		issue: [FlexColumn, OverflowHidden, makeMarginRem(1,0.5), makePaddingRem(1),{
			
			background: TinyColor(primary.hue1).darken(3).toRgbString(),
			
			row: [FlexRowCenter,FillWidth],
			
			number: [{
				fontSize: themeFontSize(1.3),
				fontWeight: 300,
				fontStyle: 'italic',
				color: text.secondary,
				
			}],
			title: [FlexScale,Ellipsis,makePaddingRem(0,1),{
				fontSize: themeFontSize(1.3),
			}],
			
			repo: [{
				color: accent.hue1
			}]
		}]
		
		
		
	} ]

}


/**
 * IIssueMultiInlineListProps
 */
export interface IIssueMultiInlineListProps extends IThemedAttributes {
	issues:List<Issue>
}

/**
 * IIssueMultiInlineListState
 */
export interface IIssueMultiInlineListState {
	
}

/**
 * IssueMultiInlineList
 *
 * @class IssueMultiInlineList
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class IssueMultiInlineList extends React.Component<IIssueMultiInlineListProps,IIssueMultiInlineListState> {
	
	render() {
		const { issues,theme, styles,style } = this.props
		
		return <div style={[styles.issues,style]}>
			{(issues.size < 20 ? issues : issues.slice(0,20)).map(issue =>
				<div key={issue.id} style={styles.issue}>
					<div style={styles.issue.row}>
						<div style={styles.issue.number}>#{issue.number}</div>
						<div style={styles.issue.title}>{issue.title}</div>
						<RepoName style={styles.issue.repo} repo={issue.repo}/>
					</div>
				
				</div>
			)}
		</div>
	}
	
}