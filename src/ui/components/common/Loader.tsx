

// Imports
import * as React from 'react'
import {PureRender} from 'ui/components/common/PureRender'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import * as shortId from 'short-id'
import {TweenLite,TimelineLite} from 'ui/util/gsap'

// Constants
const
	sliceTag = require('!!raw!assets/images/logo/slice.svg'),
	fontSize = rem(4),
	log = console,

	baseStyles = createStyles({
		root: [FillWidth,FillHeight,FlexScale,PositionRelative, {
			backgroundColor: getTheme().palette.background
		}]
	})
	


/**
 * ILoaderProps
 */
export interface ILoaderProps extends React.HTMLAttributes {
	theme?:any
	styles?:any
	animate:boolean
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
	return $(`<div></div>`).css({
		fontFamily: 'AvenirNext',
		fontWeight: 300,
		fontSize,
		color: getTheme().palette.text.secondary,
		position: 'absolute',
		left: '50%',
		top: '50%',
		width: '50%',
		zIndex: 5,
		textAlign: 'center',
		transform: 'translate(0,-50%)',
		opacity: 0
	}).html(`loading`)
}

/**
 * Loader
 *
 * @class Loader
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class Loader extends React.Component<ILoaderProps,ILoaderState> {
	
	static defaultProps = {
		animate: true
	}
	
	startAnimating() {
		const
			{element} = this.state,
			timeline = new TimelineLite()
		
		element.empty()
		
		
		const
			// Re-animate duration
			duration = 1.2,
			
			// Create slice elements first
			slices = sliceConfigs.map((config,index) => {
				const slice = makeSlice(config.fill).css({
					// marginTop: '5%',
					height: '30%',
					position: 'absolute',
					top: '50%',
					left: '25%',
					opacity: 0,
					zIndex: index,
					transform: 'translate(-50%,0)',
					transformOrigin: 'top center'
				})
				
				//noinspection JSPrimitiveTypeWrapperUsage
				const angle = config.angle = 220 + (index * 13.75)
				
				timeline.to(slice,1,{
					rotation: angle,
					opacity: 1
				},0)
				
				element.append(slice)
				
				return slice
			}),
			
			// Text element
			text = makeText().appendTo(element)
		
		
		timeline.to(text,0.3,{opacity: 1,fontSize},.6)
		timeline.addLabel('normal')
		
		slices.forEach((slice,index) => {
			const
				config = sliceConfigs[index],
				timeOffset = .3,
				sliceOffset = (timeOffset / slices.length) * index

			timeline.to(slice,duration - sliceOffset,{
				rotation: 360 + config.angle
			},`normal+=${sliceOffset}`)//2 + sliceOffset)
		})

		
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