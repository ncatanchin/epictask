package main

import Electron.BrowserView
import Electron.BrowserWindow
import Electron.BrowserWindowConstructorOptions
import __dirname

//import url.UrlObject
import kotlinext.js.*

val Url = require("url")
val Path = require("path")

val isDevelopment = process.env.NODE_ENV != "production"

/**
 * Created by plter on 7/14/17.
 */
external val process: dynamic
external val APP_PATH: String

class Main {
    //val electron: Electron// = js("require('electron')")
    val app: dynamic = Electron.app

//    val url: dynamic = js("require('url')")
//    val path: dynamic = js("require('path')")

    var mainWindow: BrowserWindow? = null
    val windowWidth: Int = 800
    val windowHeight: Int = 600


    fun createWindow():BrowserWindow {
        return mainWindow ?: run {
            val mainWindow = BrowserWindow(object : BrowserWindowConstructorOptions {
                override var width: Number? = windowWidth
                override var height: Number? = windowHeight
            })
            this@Main.mainWindow = mainWindow

//            mainWindow.loadURL(Url.format(object {
//                var pathname = Path.join(APP_PATH, "out", "production", "First", "index.html")
//                var protocol: String? = "file:"
//                var slashes: Boolean? = true
//            }) as String)

            // Open the DevTools.
            mainWindow.webContents.openDevTools()
            mainWindow.show()

            if (isDevelopment) {
                mainWindow.loadURL("http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}")
            } else {
                mainWindow.loadURL(Url.formatUrl(object {
                    val pathname =  Path.join(__dirname, "index.html")
                    val protocol = "file"
                    val slashes = true
                }) as String)
            }

            // Emitted when the window is closed.
            mainWindow.on("closed") {
                this@Main.mainWindow = null
            }

            return mainWindow
        }

    }


    init {
        app.on("ready") { createWindow() }


        app.on("window-all-closed")  {
            // On OS X it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform !== "darwin") {
                app.quit()
            }
        }

        app.on("activate") {
            // On OS X it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) {
                createWindow()
            }
        }
    }
}


fun main(args: Array<String>) {
    Main()
}