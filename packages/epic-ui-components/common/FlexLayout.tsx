
import * as Styles from "epic-styles/styles"
import { isString } from "typeguard"
declare global {
	type TFlexAlign = 'flex-start'|'flex-end'|'center'
	
	type TFlexDirection = 'column'|'column-reverse'|'row'|'row-reverse'
}

const
	FlexDefaultProps = {
		align: null,
		justify: null,
		flex: Styles.FlexAuto,
		direction: null
	},
	FlexScaleDefaultProps = {
		align: null,
		justify: null,
		flex: Styles.FlexScale,
		direction: null
	},
	FlexRowDefaultProps = {
		align: 'flex-start',
		justify: 'flex-start',
		flex: Styles.FlexAuto,
		direction: 'row'
	},
	FlexRowCenterDefaultProps = {
		align: 'center',
		justify: 'center',
		flex: Styles.FlexAuto,
		direction: 'row'
	},
	FlexColumnDefaultProps = {
		align: 'flex-start',
		justify: 'flex-start',
		flex: Styles.FlexAuto,
		direction: 'column'
	},
	FlexColumnCenterDefaultProps = {
		align: 'center',
		justify: 'center',
		flex: Styles.FlexAuto,
		direction: 'column'
	}

export interface IFlexProps extends React.HTMLAttributes<any> {
	align?:TFlexAlign
	justify?:TFlexAlign,
	direction?:TFlexDirection
	flex?:string|Object
}

function makeFlex(defaultProps):(props:IFlexProps) => React.ReactElement<IFlexProps> {
	return (props:IFlexProps) => {
		props = assign({},defaultProps,props)
		
		const
			style = !props.style ?
				{} :
				Array.isArray(props.style) ?
					makeStyle(...props.style) :
					props.style
		
		let
			{align,justify,flex,direction} = props
		
		flex = !isString(flex) ?
			flex :
			flex === 'auto' ?
				FlexAuto :
				flex === 'scale' ?
					FlexScale :
					{flex}
		
		assign(
			style,
			{display: 'flex'},
			flex,
			direction && { flexDirection: direction },
			align && {alignItems:align},
			justify && {justifyContent: justify}
		)
		
		
		return <div
			{..._.omit(props,'style','align','flex','direction','justify')}
			style={style}
	  >
			{props.children}
		</div>
			
	}
}

export const Flex = makeFlex(FlexDefaultProps)
export const FlexScale = makeFlex(FlexScaleDefaultProps)
export const FlexRow = makeFlex(FlexRowDefaultProps)
export const FlexRowCenter = makeFlex(FlexRowCenterDefaultProps)
export const FlexCenter = makeFlex(FlexColumnDefaultProps)
export const FlexColumnCenter = makeFlex(FlexColumnCenterDefaultProps)