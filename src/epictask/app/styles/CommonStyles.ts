
export function rem(val:number) {
	return `${val}rem`
}

export function makeStyle(...styles) {
	return Object.assign({},...styles)
}

export function makeFlexAlign(alignItems,justifyContent = null) {
	justifyContent = justifyContent || alignItems
	return {justifyContent,alignItems}
}

export function makeTransition(props:string[] = null,duration = 0.25,easing = 'ease-out') {
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

export const OverflowHidden = {
	overflow: 'hidden'
}

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

export const Flex = {
	display: 'flex'
}

export const FlexScale = {
	flex: '1 1 0'
}

export const FlexAuto = {
	flex: '0 0 auto'
}

export const FlexRow = makeStyle(Flex,{
	flexDirection: 'row'
})

export const FlexRowCenter = makeStyle(FlexRow,FlexScale,{
	justifyContent: 'center',
	alignItems: 'center'
})


export const FlexColumn = makeStyle(Flex,{
	flexDirection: 'column'
})

export const FlexColumnCenter = makeStyle(FlexColumn,FlexScale,{
	justifyContent: 'center',
	alignItems: 'center'
})

export const FlexAlignCenter = makeFlexAlign('center')

export const FlexAlignStart = makeFlexAlign('flex-start')

export const FlexAlignEnd = makeFlexAlign('flex-end')

export const Ellipsis = makeStyle(Flex,{
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis'
})
