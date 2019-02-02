//import "react-hot-loader/patch"
import {cold, setConfig} from "react-hot-loader"

import getLogger from "common/log/Logger"
setConfig({
  //logLevel: 'debug',
  pureSFC: true,
  pureRender: true,
  // onComponentRegister: (type, name, file) =>
  //   (String(type).indexOf('useState') > 0 ||  String(type).indexOf('useEffect') > 0) && cold(type)
})
