// Imports
import * as React from 'react'
import * as Radium from 'radium'
import { PureRender } from './PureRender'
import { ThemedStyles } from "epic-styles"
import {
	makeStyle, FlexColumnCenter, PositionAbsolute,
	PositionRelative
} from "epic-styles"


// Constants
const
	log = getLogger(__filename),
	iconWidth = 50,
	fullWidth = 216,
	/**
	 * Logo style
	 */
	logoFrames = Radium.keyframes({
		'0%': {
			opacity: 0
		},
		'100%': {
			opacity: 1
		}
	},'logo'),
	
	
	logoExpandedFrames = Radium.keyframes({
		'0%': {
			opacity: 0,
			width: iconWidth
		},
		'2%': {
			opacity: 1,
			width: iconWidth
		},
		
		'40%': {
			width: iconWidth
		},
		
		'100%': {
			opacity: 1,
			width: fullWidth
		}
	},'logo'),
	
	
	/**
	 *  Actual Spinner
	 */
	spinnerFrames = Radium.keyframes({
		'0%': {
			transform: 'rotate(0deg)'
		},
		'50%': {
			transform: 'rotate(180deg)'
		},
		'100%': {
			transform: 'rotate(360deg)'
		}
	},'spinner'),
	
	
	
	
	/**
	 * Letter E
	 */
	
	eFrames = Radium.keyframes({
		'0%': {
			opacity: 0
		},
		
		
		'100%': {
			opacity: 1
		}
	},'e'),
	
	
	
	/**
	 * Title styles
	 */
	fadeInFrames = Radium.keyframes({
		'0%': {
			width: 0,
			opacity: 0
		},
		'100%': {
			width: 150,
			opacity: 1
		}
	},'fadeIn')

function baseStyles(topStyles,theme,palette) {
	const
		{primary,text,accent} = palette
	
		
		
		
	return {
			logo:[PositionRelative, {
				width: iconWidth,
				height: iconWidth,
				opacity: 0,
				
				animationDuration: '0.3s',
				animationTimingFunction: 'linear',
				animationDelay: 0,
				animationFillMode: 'forwards',
				
				expanded: {
					animationDuration: '1.8s'
				}
				
			}],
			spinner:{
				position: 'absolute',
				top: 0,
				left: 0,
				width: iconWidth,
				height: iconWidth,
				animationDuration: '1s',
				animationTimingFunction: 'ease',
				animationDelay: 0,
				animationIterationCount: 'infinite'
			},
			
			eWrapper: makeStyle(FlexColumnCenter,PositionAbsolute,{
				top: 0,
				left: 0,
				width: iconWidth,
				height: iconWidth
			}),
			
		
			e: {
				fontFamily: 'AvenirNext',
				fontSize: iconWidth,
				transform: 'translate(0,-4px)',
				opacity: 0,
				animationDelay: '0.2s',
				animationDuration: '0.6s',
				animationTimingFunction: 'linear',
				animationFillMode: 'forwards',
				color: text.primary,
				textAlign: 'center'
				
			},
			title: {
				position: 'absolute',
				fontFamily: 'AvenirNext',
				left: iconWidth + 10,
				fontSize: 40,
				opacity: 0,
				overflow: 'hidden',
				letterSpacing: 5,
				height: iconWidth,
				fontWeight: 100,
				transform: 'translate(0px,0px)',
				//animation: 'title 4s linear',
				animationDelay: '0.8s',
				animationDuration: '1s',
				animationTimingFunction: 'linear',
				animationFillMode: 'forwards',
				color: text.primary,
				textAlign: 'center'
			},
			
		}
	
}

/**
 * ILogoProps
 */
export interface ILogoProps {
	styles?:any
	theme?:any
	style?:any
	palette?:any
	expanded?:boolean
	eHidden?:boolean
	spinnerStyle?:any
	titleStyle?:any
	eStyle?:any
	
}

/**
 * ILogoState
 */
export interface ILogoState {
	
}

/**
 * Logo
 *
 * @class Logo
 * @constructor
 **/

@ThemedStyles(baseStyles)
@PureRender
export class Logo extends React.Component<ILogoProps,ILogoState> {
	
	static defaultProps = {
		expanded: false,
		eHidden: false
	}
	
	render() {
		const
			{ eHidden,expanded,style,spinnerStyle,eStyle,titleStyle,styles } = this.props
		
		return <div
			style={[
				styles.logo,
				expanded && styles.logo.expanded,
				{animationName: expanded ? logoExpandedFrames : logoFrames},
				style
			]}>
			
			
			<div style={[styles.spinner,{animationName: spinnerFrames},spinnerStyle]}>
				<img src={require('assets/images/epic-circle.svg')}/>
			</div>
			
			{!eHidden &&
			<div style={styles.eWrapper}>
          <span style={[styles.e,{animationName: eFrames},eStyle]}>
            e
          </span>
			</div>
			}
			{expanded &&
			<div style={[styles.title,{animationName: fadeInFrames}]}>
				pictask
			</div>
			}
		</div>
		
	}
	
}