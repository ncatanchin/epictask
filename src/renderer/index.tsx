///<reference path="../../typings/custom.d.ts"/>
import 'source-map-support/register'
import './util/ErrorHandler'
import "react-hot-loader/patch"
import "./ReactHotConfig"
import * as ReactDOM from "react-dom"
import "moment-timezone"
import "common/util/RendererExt"
import "./assets/fonts/fonts.global.scss"
import "./assets/css/global.scss"
import {EventEmitter} from "events"
import "./Env"
import * as React from "react"

import {loadAndInitStore} from "common/store/AppStore"
import "renderer/store/UIAppStoreTypes"

import * as _ from 'lodash'
import * as $ from 'jquery'


window.onerror = function(message, source, lineno, colno, error) {
  console.error(message, source, lineno, colno, error)
}



require("sugar").extend()

EventEmitter.defaultMaxListeners = Number.MAX_VALUE




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

  require("common/Scheduler")
  await loadAndInitStore()
  await require('common/watchers/StorePersistWatcher').default
  await require("./init").default

  //await require("common/watchers").default

  await (require('common/watchers/ConfigWatcher')).default
  await (require('common/watchers/DataWatcher')).default

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
