// import Reactotron from 'reactotron-react-js'
//
// Reactotron
// 	.configure() // we can use plugins here -- more on this later
// 	.connect()

const {
	"default": installExtension,
	REACT_DEVELOPER_TOOLS,
	JQUERY_DEBUGGER,
	REDUX_DEVTOOLS,
	REACT_PERF
} = require('electron-devtools-installer')

const
	ScratchDevToolId = "alploljligeomonipppgaahpkenfnfkn",
	ExtendedJsConsoleId = "ieoofkiofkkmikbdnmaoaemncamdnhnd",
	ImmutableObjectFormat = "hgldghadipiblonfkkicmgcbbijnpeog"

installExtension(REACT_DEVELOPER_TOOLS)
installExtension(REACT_PERF)
installExtension(JQUERY_DEBUGGER)
installExtension(REDUX_DEVTOOLS)
installExtension(ScratchDevToolId)
installExtension(ExtendedJsConsoleId)
installExtension(ImmutableObjectFormat)




