declare type TTargetCorner ='bottom-left'|'bottom-right'|'top-left'|'top-right'
declare type TAlignHorizontal = 'left'|'middle'|'right'
declare type TAlignVertical = 'top'|'center'|'bottom'
declare type TOrigin = {horizontal:TAlignHorizontal, vertical:TAlignVertical}
declare type TCornersAndCenter =
	'bottom-center'|'bottom-left'|'bottom-right'|
		'top-center'|'top-left'|'top-right'

declare type TZDepth = 1|2|3|4|5|6