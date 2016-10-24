// import Reactotron from 'reactotron-react-js'
//
// Reactotron
// 	.configure() // we can use plugins here -- more on this later
// 	.connect()

import { acceptHot } from  "epic-common"
const
	log = getLogger(__filename),
	{
		"default": installExtension,
		REACT_DEVELOPER_TOOLS,
		JQUERY_DEBUGGER,
		REDUX_DEVTOOLS,
		REACT_PERF
	} = require('electron-devtools-installer')

const
	ScratchDevToolId = "alploljligeomonipppgaahpkenfnfkn",
	ExtendedJsConsoleId = "ieoofkiofkkmikbdnmaoaemncamdnhnd",
	ImmutableObjectFormat = "hgldghadipiblonfkkicmgcbbijnpeog",
	JetBrainsId = "hmhgeddbohgjknpmjagkdomcpobmllji"

installExtension(REACT_DEVELOPER_TOOLS)
installExtension(REACT_PERF)
installExtension(JQUERY_DEBUGGER)
installExtension(REDUX_DEVTOOLS)
//installExtension(JetBrainsId)
//installExtension(ScratchDevToolId)
//installExtension(ExtendedJsConsoleId)
installExtension(ImmutableObjectFormat)


acceptHot(module,log)
