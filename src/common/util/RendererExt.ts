import "./Ext"
import * as jQuery from 'jquery'
import * as LoDash from 'lodash'

Object.assign(global, {
  $: jQuery,
  _: LoDash
})

declare global {
  const $: typeof jQuery
  const _: typeof LoDash

}
export {}
