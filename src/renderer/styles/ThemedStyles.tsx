import * as React from "react"
import {CSSProperties} from "react"
import { isFunction,isObject } from "typeguard"
import getLogger from "../../common/log/Logger"
import * as _ from "lodash"
import {isString} from "typeguard"
import { Color, makeMaterialPalette } from "./MaterialColors"
import {
  StyledComponentProps,
  WithStylesOptions,
  StyleRulesCallback, StyleRules
} from "@material-ui/core/styles/withStyles"
import {isArray} from "typedux"
import {createMuiTheme} from "@material-ui/core"
import withStyles from "renderer/styles/withStyles"

const
  $ = require("jquery"),
  log = getLogger(__filename)

//import {createStyles, makePaddingRem} from "renderer/styles/StylesAndTheme"


export enum ViewportMode {
    Portrait,
    Landscape,
    Desktop,
    DesktopBig
}

let viewportSize:any = null

/**
 * Themed properties - merged with material-ui
 */
export interface IThemedProperties extends React.HTMLAttributes<any>,StyledComponentProps<string> {
  theme?:any
  viewportMode?:ViewportMode
  isMobile?:boolean
  isPortrait?:boolean
  styles?:any
}



/**
 * Merge styles recursive plan
 *
 * @param styles
 * @returns {any}
 */
export function mergeStyles(...styles:any[]):StyleRules<string> {
  const finalStyles = styles.reduce((allStyles,style) => {
    if (isFunction(style)) {
      allStyles.push(mergeStyles(style()))
    } else if (Array.isArray(style)) {
      allStyles.push(mergeStyles(...style))
    } else if (isObject(style)) {
      allStyles.push(Object.entries(style).reduce((expandedStyle,[key,value]) => {
        expandedStyle[key] = isArray(value) ? mergeStyles(...value) :
          isObject(value) || isFunction(value) ? mergeStyles(value) :
            value
        return expandedStyle
      },{}))
    } else {
      allStyles.push(style)
    }
    return allStyles
  },[])
  return _.merge({}, ...finalStyles)
}


export function mergeClasses(...classes:Array<String|null|false>):string {
	return classes.filter(clazz => isString(clazz)).join(' ')
}


export type StyleDeclaration = {
    [className: string]: CSSProperties | StyleDeclaration | Array<StyleDeclaration>
} | Array<{[className: string]: CSSProperties | StyleDeclaration | Array<StyleDeclaration>}>
& StyleRules<string>



/**
 * Size update
 */
function updateSize():void {
  const
    width = window.innerWidth,
    newSize =
      width >= 1280 ? ViewportMode.DesktopBig :
        width >= 1024 ? ViewportMode.Desktop :
          width >= 667 ? ViewportMode.Landscape :
            ViewportMode.Portrait
  
  log.info(`Window resized: ${width}/${newSize}`)
  viewportSize = newSize
}

updateSize()
$(window).resize(updateSize)


/**
 * Wrap a stateful component in material-ui style system
 *
 * @param {StyleRulesCallback<ClassKey extends string> | StyleRules<ClassKey extends string>} style
 * @param {WithStylesOptions<ClassKey extends string>} options
 * @returns {(C) => C}
 */
export function withStatefulStyles<ClassKey extends string = string>(
  style: StyleRulesCallback<ClassKey> | StyleRules<ClassKey> | Function,
  options?: WithStylesOptions<ClassKey>
):(any) => any {
  return withStyles(
  	isFunction(style) ? (...args) => mergeStyles((style as any)(...args) as any) :
		  mergeStyles(style as any),options) as any
	
	//Component.prototype.handleChange = e => log.info("Handle change",e)
	//log.info("Component",component)
	
}


export function makeDimensionConstraint(dim:'width'|'height',val:string|number):StyleDeclaration {
	const dimUpper = dim.charAt(0).toUpperCase() + dim.substring(1)
	return {
		[dim]: val,
		[`min${dimUpper}`]: val,
		[`max${dimUpper}`]: val,
		overflow: 'hidden'
	} as any
	
}

export function makeHeightConstraint(val:string|number):StyleDeclaration {
	return makeDimensionConstraint('height',val)
}

export function makeWidthConstraint(val:string|number):StyleDeclaration {
	return makeDimensionConstraint('width',val)
}

export function makeDimensionConstraints(width:string|number,height:string|number = width):StyleDeclaration {
	return {...makeHeightConstraint(height),...makeWidthConstraint(width)}
}

export const FillHeight = makeHeightConstraint('100%')

export const FillWidth = makeWidthConstraint('100%')

export const Fill = {
	...FillWidth,
	...FillHeight
}

export const FillWindow = Object.assign(
	makeWidthConstraint('100vw'),
	makeHeightConstraint('100vh')
)



export const CSSHoverState = ':hover'
export const CSSActiveState = ':active'
export const CSSFocusState = ':focus'

export const Transparent = 'transparent'

export const BorderBoxSizing = {
	boxSizing: 'border-box'
}


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

export const Ellipsis = makeStyle({
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis'
})

//region Positioning
export const PositionRelative: CSSProperties = {
	position: 'relative'
}

export const PositionAbsolute = {
	position: 'absolute'
}



export const TransitionDuration = {
	Short: 250,
	Long: 500
}



export interface IThemePalette {
	primary: Color
	secondary: Color
	background: Color
	text: Color
	textNight: Color
	action: Color
	success: Color
	error: Color
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
export function makeTransition(props:string[]|string|null = null,duration = TransitionDuration.Short,easing = 'ease-out'):StyleDeclaration {
	if (isString(props))
		props = [props] as any
	
	props = props || ['all']
	return {
		transition: (props as any)
			.map(prop => `${prop} ${duration}ms ${easing}`)
			.join(', '),
	}
}



export function makeFlexAlign(alignItems,justifyContent = alignItems):StyleDeclaration {
	return {justifyContent,alignItems}
}

export function makePaddingRem(top = 0, right = top, bottom = top, left = right):StyleDeclaration {
	return {
		paddingTop: rem(top),
		paddingRight: rem(right),
		paddingBottom: rem(bottom),
		paddingLeft: rem(left)
	} as any
}

export function makeBorderRem(top = 0, right = top, bottom = top, left = right):StyleDeclaration {
	return {
		borderTop: rem(top),
		borderRight: rem(right),
		borderBottom: rem(bottom),
		borderLeft: rem(left)
	} as any
}

export function makeMarginRem(top = 0, right = top, bottom = top, left = right):StyleDeclaration {
	return {
		marginTop: rem(top),
		marginRight: rem(right),
		marginBottom: rem(bottom),
		marginLeft: rem(left)
	} as any
}

export function rem(val:number):string {
	return `${val}rem`
}

export const FlexAuto = makeFlex(0,0,'auto')

/**
 * Create flex config, default is scale any size
 *
 * @param flexGrow
 * @param flexShrink
 * @param flexBasis
 */
export function makeFlex(flexGrow = 1, flexShrink = 1, flexBasis:number|string = 0):StyleDeclaration {
	return {
		flexGrow,
		flexShrink,
		flexBasis
	} as any
}

export const FlexAlignCenter = makeFlexAlign('center')

export const FlexAlignStart = makeFlexAlign('flex-start')

export const FlexAlignEnd = makeFlexAlign('flex-end')

export const FlexAlignSpaceBetween = makeFlexAlign('space-between')

export const FlexScale = makeFlex()

export const FlexWrap = {
	flexWrap: 'wrap'
}

export const FlexNowrap = {
	flexWrap: 'nowrap'
}

//region Flexbox
export const Flex = {
	display: 'flex'
}

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

export function makeStyle(...styles):StyleDeclaration {
	
	return Object.assign({},...styles.reduce((allStyles,style) => {
		if (Array.isArray(style)) {
			allStyles.push(...style)
		} else {
			allStyles.push(style)
		}
		return allStyles
	},[]))
}

export function remToPx(rem:number):number {
	return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function directChild(className:string,state:string = ""):string {
	return child(className,state,true)
}

export function child(className:string,state:string = "",direct:boolean = false):string {
	return `&${state.isEmpty() ? "" : `:${state}`} ${direct ? ">" : ""} .${className}`
}
