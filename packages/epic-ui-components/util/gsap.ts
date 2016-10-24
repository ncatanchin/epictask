
let TweenLite, TimelineLite

if (Env.isElectron) {
	__non_webpack_require__('gsap/src/uncompressed/easing/EasePack.js')
	__non_webpack_require__('gsap/src/uncompressed/plugins/CSSPlugin.js')
	
	TweenLite = __non_webpack_require__('gsap/src/uncompressed/TweenLite.js')
	TimelineLite = __non_webpack_require__('gsap/src/uncompressed/TimelineLite.js')
} else {
	require('!!script!gsap/src/uncompressed/easing/EasePack.js')
	require('!!script!gsap/src/uncompressed/plugins/CSSPlugin.js')
	
	TweenLite = require('!!script!gsap/src/uncompressed/TweenLite.js')
	TimelineLite = require('!!script!gsap/src/uncompressed/TimelineLite.js')
}



export {
	TweenLite,
	TimelineLite
}