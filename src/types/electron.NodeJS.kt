@file:Suppress("INTERFACE_WITH_SUPERCLASS", "OVERRIDING_FINAL_MEMBER", "RETURN_TYPE_MISMATCH_ON_OVERRIDE", "CONFLICTING_OVERLOADS", "EXTERNAL_DELEGATION", "NESTED_CLASS_IN_EXTERNAL_INTERFACE")
@file:JsQualifier("NodeJS")
package NodeJS

import Electron.EventEmitter
import kotlin.js.*
import kotlin.js.Json
import org.khronos.webgl.*
import org.w3c.dom.*
import org.w3c.dom.events.*
import org.w3c.dom.parsing.*
import org.w3c.dom.svg.*
import org.w3c.dom.url.*
import org.w3c.fetch.*
import org.w3c.files.*
import org.w3c.notifications.*
import org.w3c.performance.*
import org.w3c.workers.*
import org.w3c.xhr.*



external interface Process : EventEmitter {
    override fun on(event: String /* "loaded" */, listener: Function<*>): Process /* this */
    override fun once(event: String /* "loaded" */, listener: Function<*>): Process /* this */
    override fun addListener(event: String /* "loaded" */, listener: Function<*>): Process /* this */
    override fun removeListener(event: String /* "loaded" */, listener: Function<*>): Process /* this */
    fun crash()
    fun getCPUUsage(): Electron.CPUUsage
    fun getCreationTime(): Number?
    fun getHeapStatistics(): Electron.HeapStatistics
    fun getIOCounters(): Electron.IOCounters
    fun getSystemMemoryInfo(): Electron.SystemMemoryInfo
    fun hang()
    fun setFdLimit(maxDescriptors: Number)
    fun takeHeapSnapshot(filePath: String): Boolean
    var defaultApp: Boolean? get() = definedExternally; set(value) = definedExternally
    var mas: Boolean? get() = definedExternally; set(value) = definedExternally
    var noAsar: Boolean? get() = definedExternally; set(value) = definedExternally
    var noDeprecation: Boolean? get() = definedExternally; set(value) = definedExternally
    var resourcesPath: String? get() = definedExternally; set(value) = definedExternally
    var sandboxed: Boolean? get() = definedExternally; set(value) = definedExternally
    var throwDeprecation: Boolean? get() = definedExternally; set(value) = definedExternally
    var traceDeprecation: Boolean? get() = definedExternally; set(value) = definedExternally
    var traceProcessWarnings: Boolean? get() = definedExternally; set(value) = definedExternally
    var type: String? get() = definedExternally; set(value) = definedExternally
    var windowsStore: Boolean? get() = definedExternally; set(value) = definedExternally
}
external interface ProcessVersions {
    var electron: String
    var chrome: String
}
