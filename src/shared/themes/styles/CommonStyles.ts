
declare global {
	interface IStyle {
		
	}
}

export function rem(val:number) {
	return `${val}rem`
}

export function createStyles(styles:any,topStyles:any = null):any {
	topStyles = topStyles || styles

	return Object.keys(styles).reduce((expandedStyles,nextKey) => {
		const baseStyleVal = styles[nextKey]

		expandedStyles[nextKey] = (() => {
			if (Array.isArray(baseStyleVal)) {
				return createStyles(_.merge({},...baseStyleVal),topStyles)
			} else if (_.isPlainObject(baseStyleVal)) {
				return createStyles(baseStyleVal,topStyles)
			} else if (_.isFunction(baseStyleVal)) {
				return createStyles(baseStyleVal(topStyles),topStyles)
			} else {
				return baseStyleVal
			}
		})()

		return expandedStyles
	},{})
}

export function makeStyle(...styles) {
	return Object.assign({},...styles)
}

export function mergeStyles(...styles):any {
	styles = styles.reduce((allStyles,style) => {
		if (Array.isArray(style))
			allStyles.push(...style)
		else
			allStyles.push(style)
		
		return allStyles
	},[])
	return _.merge({},...styles)
}

export function makeFlexAlign(alignItems,justifyContent = null) {
	justifyContent = justifyContent || alignItems
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
export function makeTransition(props:string[]|string = null,duration = 0.25,easing = 'ease-out') {
	if (_.isString(props))
		props = [props]

	props = props || ['all']
	return {
		transition: props
            .map(prop => `${prop} ${duration}s ${easing}`)
            .join(', '),
	}
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
export const CSSFocusState = ':active'

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

export const FillHeight = {
	maxHeight: '100%',
	minHeight: '100%',
	height: '100%',
	overflow: 'hidden'
}

export const FillWidth = {
	maxWidth: '100%',
	minWidth: '100%',
	width: '100%',
	overflow: 'hidden'
}


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


