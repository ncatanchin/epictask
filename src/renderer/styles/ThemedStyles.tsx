import * as React from "react"
import * as CSS from 'csstype'
import {CSSProperties} from "react"
import { isFunction,isObject } from "typeguard"
import getLogger from "../../common/log/Logger"
import * as _ from "lodash"
import {isString} from "typeguard"
import { Color, makeMaterialPalette } from "./MaterialColors"
import {
  StyledComponentProps,
  WithStylesOptions as MUIWithStyleOptions,
  StyleRulesCallback, StyleRules, ClassNameMap
} from "@material-ui/core/styles/withStyles"
import {isArray} from "typedux"
import {createMuiTheme} from "@material-ui/core"
import withStyles from "renderer/styles/withStyles"
import {toDashCase} from "common/ObjectUtil"
import * as tinycolor from "tinycolor2"
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
export interface IThemedProperties<ClassKey extends string = string, T = any, K extends string = string> extends React.HTMLAttributes<T>,StyledComponentProps<ClassKey> {
  classes?: Partial<ClassNameMap<ClassKey>>
	theme?:Theme
  viewportMode?:ViewportMode
  isMobile?:boolean
  isPortrait?:boolean
}



/**
 * Merge styles recursive plan
 *
 * @param styles
 * @returns {any}
 */
export function mergeStyles(...styles:any[]):StyleRules<string> {
  const finalStyles = styles.reduce((allStyles,style) => {
    // if (isFunction(style)) {
    //   allStyles.push(mergeStyles(style()))
    // } else
    if (Array.isArray(style)) {
      allStyles.push(mergeStyles(...style))
    } else if (isObject(style)) {
      allStyles.push(Object.entries(style).reduce((expandedStyle,[key,value]) => {
        expandedStyle[key] = isFunction(value) ? value : isArray(value) ? mergeStyles(...value) :
          isObject(value) ? mergeStyles(value) :
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
export type AnyCSSProperties = CSSProperties & any

export type Style<P extends AnyCSSProperties = any> = Partial<P | {[className: string]: CSSProperties | {[subClass:string]:P | Array<P | {[subClass:string]:P | Array<P>}>}}>

export type Styles = Array<Partial<Style>>



export type NestedStyles = CSSProperties | {[key:string]: Style | Array<Styles | CSSProperties>} | Style | Styles

export type CssClassMap<Classes extends string = string> = {[name in Classes]: NestedStyles}

export type StyleDeclaration<Classes extends string = string> =
  CssClassMap<Classes> | Array<Partial<CssClassMap<Classes>>>
// 	{
// 	[key:Classes]:CSSProperties | {[selector:string]:CSSProperties}
// }


export type StyleCallback<Classes extends string = string> = (theme:Theme) => StyleDeclaration<Classes>


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

  log.debug(`Window resized: ${width}/${newSize}`)
  viewportSize = newSize
}

updateSize()
$(window).resize(updateSize)


export type WithStylesOptions<ClassKey extends string> = MUIWithStyleOptions<ClassKey> & {
	withRef?: boolean
}

/**
 * Wrap a stateful component in material-ui style system
 *
 * @param {StyleRulesCallback<ClassKey extends string> | StyleRules<ClassKey extends string>} style
 * @param {WithStylesOptions<ClassKey extends string>} options
 * @returns {(C) => C}
 */
export function withStatefulStyles<ClassKey extends string = string>(
  style: StyleRulesCallback<ClassKey> | Function,
  options?: WithStylesOptions<ClassKey>
):(any) => any {
  return withStyles(
  	(...args) => mergeStyles((style as any)(...args)),options) as any

	//Component.prototype.handleChange = e => log.info("Handle change",e)
	//log.info("Component",component)

}


export type CSSPropFn<P = any> = (props:P) => number|string

export function makeDimensionConstraint<P = any>(dim:'width'|'height',val:string|number|CSSPropFn<P>):React.CSSProperties {
	const dimUpper = dim.charAt(0).toUpperCase() + dim.substring(1)
	return {
		[dim]: val,
		[`min${dimUpper}`]: val,
		[`max${dimUpper}`]: val,
		overflow: 'hidden'
	} as any

}

export const HeightProperties = ["height","maxHeight","minHeight"]

export const WidthProperties = ["width","maxWidth","minWidth"]

export function makeHeightConstraint<P = any>(val:string|number|CSSPropFn<P>):React.CSSProperties {
	return makeDimensionConstraint<P>('height',val)
}

export function makeWidthConstraint<P = any>(val:string|number|CSSPropFn<P>):React.CSSProperties {
	return makeDimensionConstraint<P>('width',val)
}

export function makeDimensionConstraints<P = any>(width:string|number|CSSPropFn<P>,height:string|number|CSSPropFn<P> = width):React.CSSProperties {
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

export const PositionAbsolute: CSSProperties = {
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
  open: Color
  closed: Color
  pr: Color
}

export function alpha(color:CSS.Color,alpha:number):CSS.Color {
	return tinycolor(color).setAlpha(alpha).toRgbString()
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
export function makeTransition(props:string[]|string|null = null,duration = TransitionDuration.Short,easing = 'ease-out'):React.CSSProperties {
	if (isString(props))
		props = [props] as any

	props = props || ['all']
	return {
		transition: (props as any)
			.map(prop => `${toDashCase(prop)} ${duration}ms ${easing}`)
			.join(', '),
	}
}



export function makeFlexAlign(alignItems,justifyContent = alignItems):React.CSSProperties {
	return {justifyContent,alignItems}
}




export function makePadding(top = 0, right = top, bottom = top, left = right):React.CSSProperties {
  return {
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left
  } as any
}


export function makePaddingRem(top = 0, right = top, bottom = top, left = right):React.CSSProperties {
	return makePadding(remToPx(top),remToPx(right),remToPx(bottom),remToPx(left)) as any
}


export function makeBorder(top = 0, right = top, bottom = top, left = right):React.CSSProperties {
  return {
    borderTop: top,
    borderRight: right,
    borderBottom: bottom,
    borderLeft: left
  } as any
}

export function makeBorderRem(top = 0, right = top, bottom = top, left = right):React.CSSProperties {
  return makeBorder(remToPx(top),remToPx(right),remToPx(bottom),remToPx(left)) as any
}


export function makeMargin(top:string|number = 0, right = top, bottom = top, left = right):StyleDeclaration {
  return {
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left
  } as any
}

export function makeMarginRem(top = 0, right = top, bottom = top, left = right):StyleDeclaration {
	return makeMargin(rem(top),rem(right),rem(bottom),rem(left))
}

export const PaddingProps = Object.keys(makePaddingRem(0)).map(key => key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`))
export const MarginProps = Object.keys(makeMarginRem(0)).map(key => key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`))

export function rem(val:number):string {
	return `${remToPx(val)}px`//${val}rem`
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

export function makeStyle(...styles):NestedStyles {

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
	return Math.round(rem * parseFloat(getComputedStyle(document.documentElement).fontSize))
}

export function directChild(className:string,state:string = ""):string {
	return child(className,state,true)
}

export function child(className:string,state:string = "",direct:boolean = false):string {
	return `&${state.isEmpty() ? "" : `:${state}`} ${direct ? ">" : ""} .${className}`
}
