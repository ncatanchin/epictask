


declare module 'element-class' {

	interface ElementClassHelper {
		remove(className:string):void
		add(className:string):void
		toggle(className:string):void
		has(className:string):boolean
	}

	function elementClass(element:Element):ElementClassHelper;

	export = elementClass


}
