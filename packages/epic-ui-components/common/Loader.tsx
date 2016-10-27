

// Imports
//import {PureRender} from "epic-ui-components"
import {
	FillWindow, makeStyle,
	ImgFitFill, rem
} from "epic-styles"
//import { getTheme } from "epic-styles"
// import * as shortId from 'short-id'
//import {TweenLite,TimelineLite} from 'ui/util/gsap'

// Constants
const
	//sliceTag = require('!!raw!assets/images/logo/slice.svg'),
	fontSize = rem(4),
	log = console


function baseStyles() {
	
	
	
	return {
		root: makeStyle(FillWindow, {
			//backgroundColor: getTheme().palette.background
		}),
		logo: makeStyle({
			position: 'absolute',
			overflow: 'hidden',
			top: '50%',
			left: '50%',
			width: '40vw',
			height: '40vw',
			// width: 1,
			// height: 1,
			opacity: 0,
			
			animation: 'loader-logo 4s linear',
			//animationDuration: '1s',
			//animationTimingFunction: 'ease-in',
			//animationDelay: '0s',
			animationFillMode: 'forwards'
			
		}),
		
		tagline: makeStyle(PositionAbsolute,{
			opacity: 0,
			fontFamily: 'AvenirNext',
			fontWeight: 500,
			fontSize: rem(2.4),
			top: '65%',
			left: '50%',
			animation: 'loader-tagline 0.6s linear',
			//animationDuration: '1s',
			//animationTimingFunction: 'ease-in',
			animationDelay: '0.8s',
			animationFillMode: 'forwards'
		})
	}
		
}
/**
 * ILoaderProps
 */
export interface ILoaderProps extends React.HTMLAttributes<any> {
	
}

/**
 * ILoaderState
 */
export interface ILoaderState {
	
}


/**
 * Loader
 *
 * @class Loader
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
//@ThemedStyles(baseStyles)

export class Loader extends React.Component<ILoaderProps,ILoaderState> {
	
	static defaultProps = {
		animate: true
	}
	
	
	render() {
		const
			styles = baseStyles()
		
		return <div style={styles.root}>
			<div style={styles.logo}>
				<img src={require('assets/images/logo/epictask-icon-bg-filled.png')}
				     style={ImgFitFill}
				/>
				{/*{borderBits}*/}
			</div>
			{/*<div style={styles.tagline}>loading...</div>*/}
		</div>
	}
	
}