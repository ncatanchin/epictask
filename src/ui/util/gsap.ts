require('!!script!gsap/src/minified/easing/EasePack.min.js')
require('!!script!gsap/src/minified/plugins/CSSPlugin.min.js')
require('!!script!gsap/src/minified/TweenLite.min.js')
require('!!script!gsap/src/minified/TimelineLite.min.js')

const
	win = window as any,
	{TweenLite,TimelineLite} = win

export {
	TweenLite,
	TimelineLite
}