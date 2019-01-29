import {isMain} from "common/Process"

let fetch:typeof window.fetch = null
if (isMain()) {
  fetch = __non_webpack_require__("node-fetch").default
} else {
  fetch = (...args) => window.fetch(...args) as any
}

export default fetch
