require('./init-scripts')

echo(`Updating patch version`)

echo(`Updating version`)
execNoError(`npm version patch`)

const
	{process} = global,
	path = require('path'),
	pkg = require(path.resolve(process.cwd(),'package.json')),
	{version} = pkg,
	fs = require('fs'),
	versionProps = `
EPICTASK_VERSION=${version}
EPICTASK_BUILD=${process.env.BUILD_NUMBER}
`

echo(`Using version: ${version}`)

fs.writeFileSync(
	'epictask-version.env',
	versionProps,
	'utf8'
)
