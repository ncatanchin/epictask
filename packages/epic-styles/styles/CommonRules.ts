
//import {getTheme,getPalette} from '../ThemeState'

import { isNumber } from "typeguard"
declare global {
	interface IStyle {
		
	}
}

const
	tinycolor = require('tinycolor2')

export const TinyColor = tinycolor

export function rem(val:number) {
	return `${val}rem`
}


/**
 * Create deeply configured styles
 * @param styles
 * @param topStyles
 * @param theme
 * @param palette
 * @returns {any}
 */
//export function createStyles(styles:any,topStyles:any = null,theme = getTheme(),palette = getPalette()):any {
export function createStyles(styles:any,topStyles:any = null,theme = getTheme(),palette = getPalette()):any {
	
	if (!styles) {
		return {}
	} else if (Array.isArray(styles))
		return mergeStyles(...styles.map(style => createStyles(style,topStyles,theme,palette)))
	else if (_.isFunction(styles))
		return createStyles(styles(topStyles,theme,palette),topStyles,theme,palette)
	
	topStyles = topStyles || styles
		
	return Object.keys(styles).reduce((expandedStyles,nextKey) => {
		const baseStyleVal = styles[nextKey]

		expandedStyles[nextKey] = (() => {
			if (Array.isArray(baseStyleVal)) {
				return createStyles(_.merge({},...baseStyleVal),topStyles,theme,palette)
			} else if (_.isPlainObject(baseStyleVal)) {
				return createStyles(baseStyleVal,topStyles,theme,palette)
			} else if (_.isFunction(baseStyleVal)) {
				return createStyles(baseStyleVal(topStyles,theme,palette),topStyles,theme,palette)
			} else {
				return baseStyleVal
			}
		})()

		return expandedStyles
	},{})
}

export function makeStyle(...styles) {
	
	return Object.assign({},...styles.reduce((allStyles,style) => {
		if (Array.isArray(style)) {
			allStyles.push(...style)
		} else {
			allStyles.push(style)
		}
		return allStyles
	},[]))
}

export function mergeStyles(...styles):any {
	const finalStyles = styles.reduce((allStyles,style) => {
		if (Array.isArray(style))
			allStyles.push(mergeStyles(...style))
		else
			allStyles.push(style)
		
		return allStyles
	},[])
	return _.merge({},...finalStyles)
}

export function makeFlexAlign(alignItems,justifyContent = alignItems) {
	return {justifyContent,alignItems}
}

/**
 * Create flex config, default is scale any size
 *
 * @param flexGrow
 * @param flexShrink
 * @param flexBasis
 */
export function makeFlex(flexGrow = 1, flexShrink = 1, flexBasis:number|string = 0) {
	return {
		flexGrow,
		flexShrink,
		flexBasis
	}
}


export const TransitionDurationDefault = 0.25

export const TransitionDurationLong = 0.5

/**
 * Create a transition property with default config
 *
 * @global
 *
 * @param props
 * @param duration
 * @param easing
 * @returns {{transition: any}}
 */
export function makeTransition(props:string[]|string = null,duration = TransitionDurationDefault,easing = 'ease-out') {
	if (_.isString(props))
		props = [props]

	props = props || ['all']
	return {
		transition: props
            .map(prop => `${prop} ${duration}s ${easing}`)
            .join(', '),
	}
}

/**
 * Create a border style
 *
 * @param width
 * @param style
 * @param color
 * @returns {string}
 */
export function makeBorder(width:number|string = rem(0.1), style = 'solid', color = Transparent) {
	return `${isNumber(width) ? `${width}px` : width} ${style} ${color}`
}

/**
 * Create icon config
 *
 * @param iconSet
 * @param iconName
 * @returns {{iconSet: string, iconName: string}}
 */
export function makeIcon(iconSet:string,iconName:string) {
	return {
		iconSet,
		iconName
	}
}

export function makeDimensionConstraint(dim:'width'|'height',val:string|number) {
	const
		dimUpper = dim.charAt(0).toUpperCase() + dim.substring(1)
	return {
		[dim]: val,
		[`min${dimUpper}`]: val,
		[`max${dimUpper}`]: val,
		overflow: 'hidden'
	}
	
}

export function makeHeightConstraint(val:string|number) {
	return makeDimensionConstraint('height',val)
}

export function makeWidthConstraint(val:string|number) {
	return makeDimensionConstraint('width',val)
}

export function makeLinearGradient(...colorStops:string[]) {
	//return `-webkit-linear-gradient(${colorStops.join(',')})`
	return `linear-gradient(${colorStops.join(',')})`
}

export function makeAbsolute(top:number = 0, left:number = 0) {
	return makeStyle(PositionAbsolute,{top,left})
}

//noinspection JSSuspiciousNameCombination
export function makePaddingRem(top = 0, right = top, bottom = top, left = right) {
	return {
		paddingTop: rem(top),
		paddingRight: rem(right),
		paddingBottom: rem(bottom),
		paddingLeft: rem(left)
	}
}

//noinspection JSSuspiciousNameCombination
export function makeBorderRem(top = 0, right = top, bottom = top, left = right) {
	return {
		borderTop: rem(top),
		borderRight: rem(right),
		borderBottom: rem(bottom),
		borderLeft: rem(left)
	}
}

//noinspection JSSuspiciousNameCombination
export function makeMarginRem(top = 0, right = top, bottom = top, left = right) {
	return {
		marginTop: rem(top),
		marginRight: rem(right),
		marginBottom: rem(bottom),
		marginLeft: rem(left)
	}
}



export const CSSHoverState = ':hover'
export const CSSActiveState = ':active'
export const CSSFocusState = ':focus'

export const Transparent = 'transparent'

export const OverflowHidden = {
	overflow: 'hidden'
}

export const OverflowAuto = {
	overflow: 'auto'
}

//region Cursors
export const CursorPointer = {
	cursor: 'pointer'
}
//endregion

//region Positioning
export const PositionRelative = {
	position: 'relative'
}

export const PositionAbsolute = {
	position: 'absolute'
}

export const FillHeight = makeHeightConstraint('100%')

export const FillWidth = makeWidthConstraint('100%')

export const FillWindow = Object.assign(
	makeWidthConstraint('100vw'),
	makeHeightConstraint('100vh')
)


export const Fill = makeStyle(FillHeight,FillWidth)
export const FillNoSpacing = makeStyle(Fill,{margin:0,padding:0,border:0,outline:0})
//endregion


//region Flexbox
export const Flex = {
	display: 'flex'
}


export const FlexAlignCenter = makeFlexAlign('center')

export const FlexAlignStart = makeFlexAlign('flex-start')

export const FlexAlignEnd = makeFlexAlign('flex-end')

export const FlexScale = makeFlex()

export const FlexWrap = {
	flexWrap: 'wrap'
}

export const FlexNowrap = {
	flexWrap: 'nowrap'
}

export const FlexAuto = makeFlex(0,0,'auto')

export const FlexRow = makeStyle(Flex,{
	flexDirection: 'row'
})



export const FlexRowReverse = makeStyle(Flex,{
	flexDirection: 'row-reverse'
})

export const FlexRowCenter = makeStyle(FlexRow,FlexAlignCenter)


export const FlexColumn = makeStyle(Flex,{
	flexDirection: 'column'
})

export const FlexColumnReverse = makeStyle(Flex,{
	flexDirection: 'column-reverse'
})

export const FlexColumnCenter = makeStyle(FlexColumn,FlexAlignCenter)


//endregion

//region Text/Font
export const FontBlack = {
	fontWeight:700
}

export const Ellipsis = makeStyle({
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis'
})
//endregion

export const ImgFitFill = makeStyle(Fill,{
	objectFit: 'contain'
})


function getRootElementFontSize( ) {
	// Returns a number
	return parseFloat(
		// of the computed font-size, so in px
		getComputedStyle(
			// for the root <html> element
			document.documentElement
		)
			.fontSize
	);
}

/**
 * Is component in hover state
 *
 * @param component
 * @param keys
 * @returns {boolean}
 */
export function isHovering(component,...keys:string[]) {
	return keys.some(it => Radium.getState(component.state, it, ':hover'))
}

export function convertRem(value) {
	return value * getRootElementFontSize();
}



function measureContentHeight(
	html:string,
	width:number|string,
	style:any
):any {
	const elem = document.createElement('div')
	if (!_.isString(width))
		width = width + 'px'

	const
		useStyleKeys = Object.keys(style)
			.filter(key => style[key] && style[key] !== '' && (
			_.startsWith(key,'font') ||
			_.startsWith(key,'text') || _.startsWith(key,'line'))),
		useStyle = useStyleKeys.reduce((usedStyle,nextKey) => {
			usedStyle[nextKey] = style[nextKey]
			return usedStyle
		},{})

	Object.assign(elem.style,useStyle,{
		          width,
		maxWidth: width,
		minWidth: width,
		opacity: 0,
		position: 'absolute',
		display: 'block',
		left: '-10000px',
		top: '-10000px'
	})

	document.body.appendChild(elem)
	elem.innerHTML = html

	const result = _.pick(elem,'offsetHeight','scrollHeight')
	document.body.removeChild(elem)
	return result

}


