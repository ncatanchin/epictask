

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import * as shortId from 'short-id'
import {TweenLite,TimelineLite} from 'ui/util/gsap'

// Constants
const
	sliceTag = require('!!raw!assets/images/logo/slice.svg'),
	log = getLogger(__filename),

	baseStyles = createStyles({
		root: [FillWidth,FillHeight,FlexScale,PositionRelative, {}]
	})
	


/**
 * ILoaderProps
 */
export interface ILoaderProps extends React.HTMLAttributes {
	theme?:any
	styles?:any
}

/**
 * ILoaderState
 */
export interface ILoaderState {
	running?:boolean
	loaderId?:string
	element?:any
	timeline?:any
}

const sliceConfigs = [
	{
		fill: '#ff9900'
	},{
		fill: '#ffcc00'
	},{
		fill: '#ffff00'
	},{
		fill: '#ccff00'
	},{
		fill: '#99ff00'
	},{
		fill: '#33ff00'
	},{
		fill: '#00ff00'
	},{
		fill: '#00ff33'
	}
] as any

/**
 * Create slice image
 *
 * @returns {JQuery}
 */
function makeSlice(fill:string) {
	const slice = $(sliceTag)
	slice.find('polygon').css({
		fill
	})
	return slice
}

function makeText() {
	return $(`<div>epictask</div>`).css({
		fontFamily: 'AvenirNext',
		fontWeight: 100,
		position: 'absolute',
		left: '50%',
		top: '50%',
		width: '50%',
		textAlign: 'center',
		fontSize: '6rem',
		transform: 'translate(0,-50%)',
		opacity: 0,
		color: 'black'
	})
}

/**
 * Loader
 *
 * @class Loader
 * @constructor
 **/

@connect(createStructuredSelector({
	// Props mapping go here, use selectors
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@Radium
@PureRender
export class Loader extends React.Component<ILoaderProps,ILoaderState> {
	
	
	startAnimating() {
		const
			{element} = this.state,
			timeline = new TimelineLite()
		
		element.empty()
		
		
		const
			slices = sliceConfigs.map((config,index) => {
				const slice = makeSlice(config.fill).css({
					// marginTop: '5%',
					height: '40%',
					position: 'absolute',
					top: '50%',
					left: '50%',
					opacity: 0,
					transform: 'translate(-50%,0)',
					transformOrigin: 'top center'
				})
				
				const angle = config.angle = 220 + (index * 13.75)
				
				timeline.to(slice,1,{
					rotation: angle,
					opacity: 1
					//transform: `translate(-50%,0) rotate(${360 + 210 + (index * 15)}deg)`
				},0)
				
				element.append(slice)
				
				return slice
			}),
			text = makeText().appendTo(element)
		
		timeline
			.to(text,0.6,{opacity: 1},.75)
			.delay(1)
			.to(text,0.6,{opacity:0})
			.addLabel('normal')
		
		const duration = 1.2
		
		slices.forEach((slice,index) => {
			const
				config = sliceConfigs[index],
				timeOffset = .3,
				sliceOffset = (timeOffset / slices.length) * index
			
			timeline.to(slice,duration - sliceOffset,{
				rotation: 360 + config.angle
			},`normal+=${sliceOffset}`)//2 + sliceOffset)
		})
		
		timeline.to(text,duration,{opacity: 1},`normal+=${duration * .75}`)
		timeline.delay(1)
		timeline.to(text,duration / 3,{opacity: 0})
		timeline.call(() => {
				timeline.seek('normal')
		})
		
	}
	
	stopAnimating() {
		const {timeline} = this.state
		this.setState({
			running:false,
			timeline: null
		}, () => {
			if (timeline) {
				timeline.kill()
			}
		})
	}
		
	/**
	 * Set the component and create a unique loader id
	 */
	componentWillMount() {
		this.setState({loaderId: `loader${shortId.generate()}`})
	}
	
	componentDidMount() {
		this.setState({
			running: true,
			element: $(document.getElementById(this.state.loaderId))
		}, () => {
			this.startAnimating()
		})
	}
	
	componentWillUnmount() {
		this.stopAnimating()
	}
	
	render() {
		const {theme, styles} = this.props
		
		return <div id={this.state.loaderId}
		            style={styles.root}>
		</div>
	}
	
}