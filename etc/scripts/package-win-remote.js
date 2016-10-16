#!/usr/bin/env node
require('./init-scripts')

//exec(`gulp win-sync`)

echo(`SSH-ing to windows & compiling`)
// const
// 	{out,error} = ssh(`jglanz@10.0.1.49`,`node ${WindowsEpicPath}/etc/scripts/package.js`)

// echo(`SSH output`,out)
// if (error && error.length) {
// 	console.error(`An error occurred`,error)
// 	process.exit(1)
// }
const
	winScript = `

cd "${WindowsEpicPath}"

npm run package
`

require('fs').writeFileSync(`/tmp/epic-build.bat`,winScript)
exec(`scp /tmp/epic-build.bat 10.0.1.49:.`)
//exec(`ssh jglanz@10.0.1.49 npm i shelljs`)
//exec(`ssh -v jglanz@10.0.1.49 c:\\users\\jglanz\\epic-build.bat`)
exec(`ssh -v jglanz@10.0.1.49 node ${WindowsEpicPath}/etc/scripts/exec-remote.js package`)
// mkdir(`-p`,'dist/build/windows')
// exec(`scp -r 10.0.1.49:${WindowsEpicPath}/dist/build/* dist/build/windows/`)