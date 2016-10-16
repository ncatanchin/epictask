require('./init-scripts')

module.exports = (doWIn,doLinux) => {
	if (doWin) {
		echo(`Packaging on Windows`)
		require('./package-win-remote')
	}
	
	if (doLinux) {
		echo(`Packaging on Linux`)
		require('./package-linux-remote')
	}
	
}
