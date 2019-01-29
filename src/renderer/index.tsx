///<reference path="../../typings/custom.d.ts"/>
import 'source-map-support/register'
//import "react-hot-loader/patch"
//import "@babel/polyfill"
import "common/util/Ext"
import "./ReactHotConfig"
//import Sugar from "sugar"

import "./assets/fonts/fonts.global.scss"
import "./assets/css/global.scss"
import {EventEmitter} from "events"
import "./Env"
import * as React from "react"
import * as ReactDOM from "react-dom"
import {loadAndInitStore} from "common/store/AppStore"
import * as jQuery from 'jquery'
import * as LoDash from 'lodash'
import "renderer/store/UIAppStoreTypes"

declare global {
  const $:typeof jQuery
  const _:typeof LoDash
}

require("sugar").extend()

EventEmitter.defaultMaxListeners = Number.MAX_VALUE

Object.assign(global, {
  $: jQuery,
  _: LoDash
})


const
  appEl = $("#app")


$("body, #app").css({
  width: "100vw",
  maxWidth: "100vw",
  height: "100vh",
  maxHeight: "100vh",
  overflow: "hidden",
  border: 0,
  margin: 0,
  padding: 0
})

let rendered = false

async function renderRoot():Promise<void> {
  const doRender = ():void => {
    if (rendered)
      return

    rendered = true
    const
      Root = require("./Root").default

    ReactDOM.render(
      <Root/>,
      appEl[0]
    )
  }

  await import("common/Scheduler")
  await loadAndInitStore()
  await require("./init").default
  await require("common/watchers").default

  require("renderer/watchers/DialogWatcher")

  doRender()
}

// noinspection JSIgnoredPromiseFromCall
renderRoot()


if (module.hot) {
  module.hot.accept(["renderer/styles/Themes"],updates => {
    console.info("Re-render root",updates)
    renderRoot().catch(err => console.error("Failed to render root",err))
  })
}
